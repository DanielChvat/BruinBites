const axios = require("axios");
const cheerio = require("cheerio");

// GPT Prompt for ingredient parsing:
/*
Extract all ingredients from UCLA dining hall menu items. Follow these rules:
1. Break down compound ingredients into their base components
   Example: "Pomodoro Sauce (Tomatoes, Garlic)" -> ["tomatoes", "garlic"]
2. Include both container and contained ingredients
   Example: "Tomatoes (Diced)" -> ["tomatoes", "diced tomatoes"]
3. Clean and normalize each ingredient:
   - Convert to lowercase
   - Remove descriptions in parentheses
   - Remove percentages and measurements
   - Remove prefixes like "contains", "includes", "with"
4. Handle nested ingredients:
   Example: "Pasta (Wheat Flour (Enriched))" -> ["pasta", "wheat flour"]
5. Special cases:
   - Keep both generic and specific names: "Beans (Pinto)" -> ["beans", "pinto beans"]
   - Remove "contains X% or less" statements
   - Remove allergen warnings
   - Remove preparation methods (diced, chopped, etc.)
*/

const PREPARATION_METHODS = [
    "diced",
    "chopped",
    "minced",
    "sliced",
    "ground",
    "powdered",
    "dried",
    "fresh",
    "frozen",
    "canned",
    "cooked",
    "raw",
    "prepared",
    "cultured",
    "enriched",
    "refined",
    "pureed",
    "crushed",
    "whole",
    "peeled",
    "smoked",
    "added",
    "free-flowing",
    "natural",
    "sundried",
    "vine-ripened",
];

const DESCRIPTORS_TO_REMOVE = [
    "contains",
    "includes",
    "with",
    "and",
    "or",
    "in",
    "pure",
    "natural",
    "organic",
    "conventional",
    "processed",
    "modified",
    "concentrated",
    "low-fat",
    "white",
    "black",
    "extra",
    "virgin",
    "to",
    "make",
    "halal",
];

const COMPOUND_EXCEPTIONS = [
    "sauce",
    "blend",
    "mix",
    "oil",
    "powder",
    "extract",
    "syrup",
    "puree",
    "paste",
    "juice",
    "water",
    "milk",
    "cream",
    "dioxide",
    "acid",
    "flavor",
    "sugar",
    "olive oil",
    "canola oil",
    "lemon juice",
    "cayenne pepper",
    "black pepper",
];

const INGREDIENTS_TO_SKIP = new Set([
    "water",
    "salt",
    "kosher salt",
    "enzymes",
    "calcium",
    "chloride",
    "acid",
    "dioxide",
    "glucose",
    "sulfate",
    "mononitrate",
    "silicone",
    "sugar",
    "cane sugar",
    "to",
    "make",
    "added",
    "free-flowing",
    "natural",
    "flavor",
]);

function cleanIngredient(ingredient) {
    // Convert to lowercase and trim
    let cleaned = ingredient.toLowerCase().trim();

    // Remove "contains X% or less" statements
    cleaned = cleaned.replace(/contains .+% or less of.*$/i, "");
    cleaned = cleaned.replace(/\d+% or less.*$/i, "");

    // Remove allergen warnings
    cleaned = cleaned.replace(/allergen.*$/i, "");
    cleaned = cleaned.replace(/may contain.*$/i, "");

    // Remove preparation methods
    const prepMethodsPattern = new RegExp(
        `\\b(${PREPARATION_METHODS.join("|")})\\b`,
        "gi"
    );
    cleaned = cleaned.replace(prepMethodsPattern, "");

    // Remove descriptors
    const descriptorsPattern = new RegExp(
        `\\b(${DESCRIPTORS_TO_REMOVE.join("|")})\\b`,
        "gi"
    );
    cleaned = cleaned.replace(descriptorsPattern, "");

    // Remove parenthetical content
    cleaned = cleaned.replace(/\([^)]*\)/g, "");

    // Remove punctuation and extra spaces
    cleaned = cleaned
        .replace(/[.,;:()]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    // Skip empty or common ingredients
    if (!cleaned || INGREDIENTS_TO_SKIP.has(cleaned)) {
        return [];
    }

    // Handle vitamins
    if (cleaned.match(/^vitamin [a-z][0-9]?/i)) {
        return [cleaned.replace(/\s+/g, "")];
    }

    // Check if the entire cleaned string is a compound exception
    if (COMPOUND_EXCEPTIONS.includes(cleaned)) {
        return [cleaned];
    }

    // Handle compound ingredients
    if (cleaned.includes(" ")) {
        const words = cleaned.split(" ").filter((w) => w.length > 0);

        // Skip if any word is in the skip list
        if (words.some((w) => INGREDIENTS_TO_SKIP.has(w))) {
            const mainIngredient = words.find(
                (w) => !INGREDIENTS_TO_SKIP.has(w)
            );
            return mainIngredient ? [mainIngredient] : [];
        }

        // Handle special compound ingredients
        if (words.length === 2) {
            const [first, second] = words;

            // If the combination is in exceptions, keep as is
            if (COMPOUND_EXCEPTIONS.includes(`${first} ${second}`)) {
                return [cleaned];
            }

            // For other compounds, split into components
            return [first, second].filter(Boolean);
        }

        // For longer compounds (e.g., "durum wheat flour"), keep as is
        return [cleaned];
    }

    return [cleaned];
}

function extractIngredients(text) {
    // Remove multiple spaces and trim
    text = text.replace(/\s+/g, " ").trim();

    const ingredients = [];
    let currentDepth = 0;
    let currentIngredient = "";
    let insideParens = false;

    for (const char of text) {
        if (char === "(") {
            if (currentDepth === 0) {
                // Save the outer ingredient if it exists
                const outer = currentIngredient.trim();
                if (outer && !outer.endsWith(":")) {
                    ingredients.push(outer);
                }
                currentIngredient = "";
                insideParens = true;
            }
            currentDepth++;
        } else if (char === ")") {
            currentDepth--;
            if (currentDepth === 0) {
                insideParens = false;
                // Process the content inside parentheses
                if (currentIngredient.trim()) {
                    ingredients.push(
                        ...currentIngredient.split(",").map((i) => i.trim())
                    );
                }
                currentIngredient = "";
            }
        } else if (char === "," && !insideParens) {
            if (currentIngredient.trim()) {
                ingredients.push(currentIngredient.trim());
            }
            currentIngredient = "";
        } else {
            currentIngredient += char;
        }
    }

    // Add the last ingredient if any
    if (currentIngredient.trim()) {
        ingredients.push(currentIngredient.trim());
    }

    return ingredients;
}

function parseIngredients(ingredientsText) {
    if (!ingredientsText) return [];

    // First, extract all ingredients including those in parentheses
    const extractedIngredients = extractIngredients(ingredientsText);

    // Clean and normalize each ingredient
    const cleanedIngredients = extractedIngredients
        .flatMap(cleanIngredient)
        .filter((i) => i.length > 0)
        .filter((i) => !i.match(/^\d+%$/)) // Remove percentage entries
        .filter((i) => !i.match(/allergen/i)) // Remove allergen warnings
        .filter((i) => !i.match(/^(vitamin|iron|acid|sulfate|dioxide)$/i)); // Remove standalone supplements

    // Remove duplicates and sort
    return Array.from(new Set(cleanedIngredients)).sort();
}

async function getDishes(url, diningHallId) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const dishes = [];

        $(".menu-item").each((_, element) => {
            const name = $(element).find(".menu-item-name").text().trim();
            const recipe =
                $(element).find(".menu-item-recipe a").attr("href") || "";
            const ingredientsText = $(element)
                .find(".menu-item-ingredients")
                .text()
                .trim();
            const ingredients = parseIngredients(ingredientsText).join(",");
            const dietaryTags = {};

            $(element)
                .find(".menu-item-dietary-tags span")
                .each((_, tag) => {
                    const tagCode = $(tag).attr("class")?.split("-")[1] || "";
                    dietaryTags[tagCode] = true;
                });

            dishes.push({
                NAME: name,
                RECIPE: recipe,
                INGREDIENTS: ingredients,
                "DIETARY TAGS": dietaryTags,
                DINING_HALL_ID: diningHallId,
            });
        });

        return dishes;
    } catch (error) {
        console.error(`Error fetching dishes from ${url}:`, error);
        return [];
    }
}

module.exports = {
    getDishes,
    parseIngredients,
};
