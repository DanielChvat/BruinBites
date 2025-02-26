import { config } from "dotenv";
import { resolve } from "path";
import { parse } from "node-html-parser";

// Load environment variables from the root .env file
config({ path: resolve(__dirname, "../.env") });

import { supabase } from "../src/lib/supabase";
import { getBaseUrl } from "../src/lib/config";

interface Dish {
    NAME: string;
    RECIPE: string;
    INGREDIENTS: string;
    "DIETARY TAGS": Record<string, boolean>;
    DINING_HALL_ID: number;
    MEAL_PERIOD: string;
}

function parseIngredients(rawText: string): string[] {
    if (!rawText) return [];

    // Remove the disclaimer text that appears after ingredients
    const cleanText = rawText.split("If you have food allergies")[0];

    // Split by commas and clean up each ingredient
    return cleanText
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => {
            // Filter out empty strings and obvious non-ingredients
            if (!ingredient) return false;
            if (ingredient.includes("Los Angeles")) return false;
            if (ingredient.includes("CA 90095")) return false;
            if (ingredient.toLowerCase().includes("please be advised"))
                return false;
            if (ingredient.toLowerCase().includes("nutrition information"))
                return false;
            return true;
        })
        .map((ingredient) => {
            // Truncate to 250 chars to avoid DB issues
            return ingredient.slice(0, 250);
        });
}

function getMealPeriodFromUrl(url: string): string {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("breakfast")) return "Breakfast";
    if (lowerUrl.includes("lunch")) return "Lunch";
    if (lowerUrl.includes("dinner")) return "Dinner";
    if (lowerUrl.includes("late")) return "Late Night";
    return "Unknown";
}

async function fetchRecipeIngredients(recipeUrl: string): Promise<string> {
    if (!recipeUrl) return "";

    try {
        console.log(`Fetching ingredients from ${recipeUrl}`);
        const response = await fetch(recipeUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const root = parse(html);

        // Find the text that starts with "INGREDIENTS:" and extract everything after it
        const ingredientsSection =
            root.querySelector("body")?.text.replace(/\n/g, " ") || "";
        const ingredientsMatch = ingredientsSection.match(
            /INGREDIENTS:\s*([^]*?)(?=ALLERGENS|\*|$)/
        );
        const ingredients = ingredientsMatch ? ingredientsMatch[1].trim() : "";
        console.log(`Found ingredients: ${ingredients}`);
        return ingredients;
    } catch (error) {
        console.error("Error fetching recipe ingredients:", error);
        return "";
    }
}

async function fetchDishes(url: string): Promise<Dish[]> {
    console.log(`Fetching dishes from ${url}`);
    const mealPeriod = getMealPeriodFromUrl(url);
    if (!mealPeriod) {
        console.error(`Could not determine meal period from URL: ${url}`);
        return [];
    }
    console.log(`Meal period: ${mealPeriod}`);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const root = parse(html);
        const dishes: Dish[] = [];

        // Get dining hall ID from URL
        const diningHallId = getDiningHallIdFromUrl(url);

        // Find all menu items
        const menuItems = root.querySelectorAll(".menu-item");
        console.log(`Found ${menuItems.length} menu items on the page`);

        for (const menuItem of menuItems) {
            // Extract dish name and recipe link
            const recipeLink = menuItem.querySelector(".recipelink");
            const name = recipeLink ? String(recipeLink.text).trim() : "";
            const recipeUrl = recipeLink?.getAttribute("href") || "";
            // Extract recipe ID and serving size from the URL
            const recipeMatch = recipeUrl.match(/\/Recipes\/(\d+)\/(\d+)/);
            const recipeId = recipeMatch?.[1];
            const servingSize = recipeMatch?.[2];
            const recipe =
                recipeId && servingSize
                    ? `https://menu.dining.ucla.edu/Recipes/${recipeId}/${servingSize}`
                    : "";

            // Extract dietary tags
            const dietaryTags: Record<string, boolean> = {};
            const tagElements = menuItem.querySelectorAll(".webcode-16px");

            for (const tagElement of tagElements) {
                const altText = tagElement.getAttribute("alt");
                if (altText) {
                    dietaryTags[altText] = true;
                }
            }

            if (name) {
                const dish: Dish = {
                    NAME: name,
                    RECIPE: recipe,
                    INGREDIENTS: "", // Will be populated later for new dishes
                    "DIETARY TAGS": dietaryTags,
                    DINING_HALL_ID: diningHallId,
                    MEAL_PERIOD: mealPeriod,
                };
                dishes.push(dish);
                console.log(`Found dish: ${dish.NAME} (${dish.MEAL_PERIOD})`);
            }
        }

        return dishes;
    } catch (error) {
        console.error("Error fetching dishes:", error);
        return [];
    }
}

function getDiningHallIdFromUrl(url: string): number {
    const normalizedUrl = url.toLowerCase();
    if (normalizedUrl.includes("epicuria")) return 1;
    if (normalizedUrl.includes("deneve")) return 2;
    if (normalizedUrl.includes("bruinplate")) return 3;
    return 0;
}

function getDiningHallId(restaurantName: string): number {
    const normalizedName = restaurantName.toLowerCase();
    if (normalizedName.includes("epicuria")) return 1;
    if (normalizedName.includes("de neve")) return 2;
    if (normalizedName.includes("bruin plate")) return 3;
    return 0;
}

function getDietaryTagsAsRecord(typeInfo: string): Record<string, boolean> {
    const tags: Record<string, boolean> = {};

    // Version 2 format
    if (typeInfo.includes("v")) tags["Vegetarian"] = true;
    if (typeInfo.includes("g")) tags["Vegan"] = true;
    if (typeInfo.includes("p")) tags["Contains Peanuts"] = true;
    if (typeInfo.includes("t")) tags["Contains Tree Nuts"] = true;
    if (typeInfo.includes("w")) tags["Contains Wheat"] = true;
    if (typeInfo.includes("s")) tags["Contains Soy"] = true;
    if (typeInfo.includes("d")) tags["Contains Dairy"] = true;
    if (typeInfo.includes("e")) tags["Contains Eggs"] = true;
    if (typeInfo.includes("l")) tags["Contains Shellfish"] = true;
    if (typeInfo.includes("f")) tags["Contains Fish"] = true;
    if (typeInfo.includes("c")) tags["Low-Carbon Footprint"] = true;

    return tags;
}

async function getOrCreateIngredient(name: string) {
    // First try to get the existing ingredient
    const { data: existingIngredient, error: getError } = await supabase
        .from("ingredients")
        .select()
        .eq("name", name)
        .single();

    if (getError && getError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error checking ingredient:", getError);
        return null;
    }

    if (existingIngredient) {
        return existingIngredient;
    }

    // If not found, create new ingredient
    const { data: newIngredient, error: createError } = await supabase
        .from("ingredients")
        .insert({ name })
        .select()
        .single();

    if (createError) {
        console.error("Error creating ingredient:", createError);
        return null;
    }

    return newIngredient;
}

async function getDishIfExists(name: string, dining_hall_id: number) {
    const { data, error } = await supabase
        .from("dishes")
        .select()
        .eq("name", name)
        .eq("dining_hall_id", dining_hall_id)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error checking dish existence:", error);
        return null;
    }

    return data;
}

async function processNewDish(dish: Dish, dishId: number) {
    console.log(`\nProcessing dish: ${dish.NAME}`);
    console.log(`Recipe URL: ${dish.RECIPE}`);

    // Fetch ingredients for new dish
    try {
        const ingredients = await fetchRecipeIngredients(dish.RECIPE);
        console.log(`Raw ingredients text: "${ingredients}"`);

        // Process ingredients
        const ingredientsList = parseIngredients(ingredients);
        console.log(`Parsed ${ingredientsList.length} ingredients:`);
        ingredientsList.forEach((ingredient, index) => {
            console.log(`  ${index + 1}. ${ingredient}`);
        });

        let successfulIngredients = 0;
        for (const ingredient of ingredientsList) {
            const ingredientData = await getOrCreateIngredient(ingredient);

            if (!ingredientData) {
                console.log(`❌ Failed to process ingredient: ${ingredient}`);
                continue;
            }

            // Create dish-ingredient relationship
            const { error: relationError } = await supabase
                .from("dish_ingredients")
                .upsert({
                    dish_id: dishId,
                    ingredient_id: ingredientData.id,
                });

            if (relationError) {
                console.error(
                    `❌ Error creating relationship for ingredient: ${ingredient}`,
                    relationError
                );
            } else {
                successfulIngredients++;
            }
        }
        console.log(
            `✓ Processed ${successfulIngredients}/${ingredientsList.length} ingredients`
        );
    } catch (error) {
        console.error("Error processing ingredients:", error);
    }

    // Process dietary tags
    const dietaryTags = Object.entries(dish["DIETARY TAGS"]).filter(
        ([_, value]) => value
    );
    console.log(`Processing ${dietaryTags.length} dietary tags...`);

    let successfulTags = 0;
    for (const [tag, value] of dietaryTags) {
        const { data: tagData, error: tagError } = await supabase
            .from("dietary_tags")
            .select()
            .eq("code", tag)
            .single();

        if (tagError) {
            console.error(`❌ Error getting dietary tag: ${tag}`, tagError);
            continue;
        }

        const { error: relationError } = await supabase
            .from("dish_dietary_tags")
            .upsert({
                dish_id: dishId,
                tag_id: tagData.id,
            });

        if (relationError) {
            console.error(
                `❌ Error creating relationship for tag: ${tag}`,
                relationError
            );
        } else {
            successfulTags++;
        }
    }
    console.log(
        `✓ Processed ${successfulTags}/${dietaryTags.length} dietary tags`
    );
}

async function populateDatabase() {
    try {
        const baseUrl = "https://menu.dining.ucla.edu/Menus";
        const diningHalls = [
            { name: "Epicuria", url: `${baseUrl}/Epicuria` },
            { name: "De Neve", url: `${baseUrl}/DeNeve` },
            { name: "Bruin Plate", url: `${baseUrl}/BruinPlate` },
        ];

        let totalDishesProcessed = 0;
        let newDishesAdded = 0;
        let existingDishesUpdated = 0;
        let errors = 0;

        for (const hall of diningHalls) {
            console.log(`\n=== Processing ${hall.name} ===`);

            // Get current meal period based on time
            const now = new Date();
            const hour = now.getHours();
            let currentMealPeriod = "Lunch"; // Default to lunch
            if (hour >= 0 && hour < 10) currentMealPeriod = "Breakfast";
            else if (hour >= 11 && hour < 15) currentMealPeriod = "Lunch";
            else currentMealPeriod = "Dinner";

            console.log(`Current meal period: ${currentMealPeriod}`);

            // Fetch dishes for the current meal period
            const mealPeriodUrl = `${
                hall.url
            }/today/${currentMealPeriod.toLowerCase()}`;
            const dishes = await fetchDishes(mealPeriodUrl);
            console.log(
                `Found ${dishes.length} dishes for ${currentMealPeriod}`
            );

            for (const dish of dishes) {
                totalDishesProcessed++;
                console.log(
                    `\nProcessing dish ${totalDishesProcessed}/${dishes.length}: ${dish.NAME}`
                );

                // Check if dish already exists
                const existingDish = await getDishIfExists(
                    dish.NAME,
                    dish.DINING_HALL_ID
                );

                if (existingDish) {
                    console.log(
                        `Dish ${dish.NAME} already exists, updating menu...`
                    );
                    existingDishesUpdated++;

                    // Get meal period ID
                    const { data: mealPeriod, error: mealPeriodError } =
                        await supabase
                            .from("meal_periods")
                            .select()
                            .eq("name", currentMealPeriod)
                            .single();

                    if (mealPeriodError) {
                        console.error(
                            `Error getting meal period: ${mealPeriodError.message}`
                        );
                        errors++;
                        continue;
                    }

                    // Add existing dish to menu using dish_meal_periods table with upsert
                    const { error: menuError } = await supabase
                        .from("dish_meal_periods")
                        .upsert(
                            {
                                dish_id: existingDish.id,
                                meal_period_id: mealPeriod.id,
                                dining_hall_id: dish.DINING_HALL_ID,
                                date: new Date().toISOString().split("T")[0],
                            },
                            {
                                onConflict:
                                    "dish_id,meal_period_id,dining_hall_id,date",
                            }
                        );

                    if (menuError) {
                        console.error(
                            `Error updating menu for existing dish: ${menuError.message}`
                        );
                        errors++;
                    } else {
                        console.log(
                            `✓ Added ${dish.NAME} to ${currentMealPeriod} menu`
                        );
                    }
                    continue;
                }

                // Process new dish
                console.log(`Processing new dish: ${dish.NAME}`);
                const ingredients = await fetchRecipeIngredients(dish.RECIPE);
                const parsedIngredients = parseIngredients(ingredients);

                // Create new dish
                const { data: newDish, error: dishError } = await supabase
                    .from("dishes")
                    .insert({
                        name: dish.NAME,
                        recipe_url: dish.RECIPE,
                        dining_hall_id: dish.DINING_HALL_ID,
                    })
                    .select()
                    .single();

                if (dishError) {
                    console.error(`Error creating dish: ${dishError.message}`);
                    errors++;
                    continue;
                }

                if (newDish) {
                    newDishesAdded++;
                    console.log(`✓ Created new dish: ${dish.NAME}`);

                    // Get meal period ID
                    const { data: mealPeriod, error: mealPeriodError } =
                        await supabase
                            .from("meal_periods")
                            .select()
                            .eq("name", currentMealPeriod)
                            .single();

                    if (mealPeriodError) {
                        console.error(
                            `Error getting meal period: ${mealPeriodError.message}`
                        );
                        errors++;
                        continue;
                    }

                    // Add new dish to menu using dish_meal_periods table with upsert
                    const { error: menuError } = await supabase
                        .from("dish_meal_periods")
                        .upsert(
                            {
                                dish_id: newDish.id,
                                meal_period_id: mealPeriod.id,
                                dining_hall_id: dish.DINING_HALL_ID,
                                date: new Date().toISOString().split("T")[0],
                            },
                            {
                                onConflict:
                                    "dish_id,meal_period_id,dining_hall_id,date",
                            }
                        );

                    if (menuError) {
                        console.error(
                            `Error adding new dish to menu: ${menuError.message}`
                        );
                        errors++;
                    } else {
                        console.log(
                            `✓ Added ${dish.NAME} to ${currentMealPeriod} menu`
                        );
                    }

                    // Process ingredients
                    await processNewDish(dish, newDish.id);
                }
            }
        }

        console.log("\n=== Database Population Summary ===");
        console.log(`Total dishes processed: ${totalDishesProcessed}`);
        console.log(`New dishes added: ${newDishesAdded}`);
        console.log(`Existing dishes updated: ${existingDishesUpdated}`);
        console.log(`Errors encountered: ${errors}`);
        console.log("================================\n");
    } catch (error) {
        console.error("Error populating database:", error);
    }
}

populateDatabase();
