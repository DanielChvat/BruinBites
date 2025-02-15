import axios from "axios";
import * as cheerio from "cheerio";

interface Dish {
    NAME: string;
    RECIPE: string;
    INGREDIENTS: string;
    "DIETARY TAGS": Record<string, boolean>;
    DINING_HALL_ID: number;
}

function cleanIngredient(ingredient: string): string {
    // Remove nested parentheses content
    let cleaned = ingredient;
    while (cleaned.includes("(") && cleaned.includes(")")) {
        cleaned = cleaned.replace(/\([^()]*\)/g, "");
    }

    // Clean up any remaining artifacts and trim
    return cleaned
        .replace(/[(),]/g, "") // Remove parentheses and commas
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();
}

function parseIngredients(ingredientsText: string): string[] {
    // Split on commas but handle nested parentheses
    const ingredients: string[] = [];
    let currentIngredient = "";
    let parenthesesCount = 0;

    for (let i = 0; i < ingredientsText.length; i++) {
        const char = ingredientsText[i];

        if (char === "(") {
            parenthesesCount++;
            currentIngredient += char;
        } else if (char === ")") {
            parenthesesCount--;
            currentIngredient += char;
        } else if (char === "," && parenthesesCount === 0) {
            if (currentIngredient.trim()) {
                ingredients.push(cleanIngredient(currentIngredient));
            }
            currentIngredient = "";
        } else {
            currentIngredient += char;
        }
    }

    // Add the last ingredient if exists
    if (currentIngredient.trim()) {
        ingredients.push(cleanIngredient(currentIngredient));
    }

    // Filter out empty strings and duplicates
    return Array.from(new Set(ingredients.filter((i) => i.length > 0)));
}

export async function getDishes(
    url: string,
    diningHallId: number
): Promise<Dish[]> {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const dishes: Dish[] = [];

        $(".menu-item").each((_: number, element: cheerio.Element) => {
            const name = $(element).find(".menu-item-name").text().trim();
            const recipe =
                $(element).find(".menu-item-recipe a").attr("href") || "";
            const ingredientsText = $(element)
                .find(".menu-item-ingredients")
                .text()
                .trim();
            const ingredients = parseIngredients(ingredientsText).join(",");
            const dietaryTags: Record<string, boolean> = {};

            // Parse dietary tags
            $(element)
                .find(".menu-item-dietary-tags span")
                .each((_: number, tag: cheerio.Element) => {
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
