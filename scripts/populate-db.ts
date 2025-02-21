import { config } from "dotenv";
import { resolve } from "path";
import { supabase } from "../src/lib/supabase";
import { getBaseUrl } from "../src/lib/config";

// Load environment variables from the root .env file
config({ path: resolve(__dirname, "../.env") });

interface Dish {
    NAME: string;
    RECIPE: string;
    INGREDIENTS: string;
    "DIETARY TAGS": Record<string, boolean>;
    DINING_HALL_ID: number;
}

async function fetchDishes(url: string, diningHallId: number): Promise<Dish[]> {
    const baseUrl = getBaseUrl();
    const apiUrl = new URL("/api/scrape", baseUrl);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("diningHallId", diningHallId.toString());

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch dishes: ${response.statusText}`);
    }

    return response.json();
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

async function populateDatabase() {
    try {
        console.log("Starting to fetch dishes from dining halls...");

        console.log("Fetching Epicuria dishes...");
        const epicuriaDishes = await fetchDishes(
            "https://menu.dining.ucla.edu/Menus/Epicuria",
            0
        );
        console.log(`Found ${epicuriaDishes.length} dishes from Epicuria`);

        console.log("Fetching De Neve dishes...");
        const deNeveDishes = await fetchDishes(
            "https://menu.dining.ucla.edu/Menus/DeNeve",
            1
        );
        console.log(`Found ${deNeveDishes.length} dishes from De Neve`);

        console.log("Fetching Bruin Plate dishes...");
        const bPlateDishes = await fetchDishes(
            "https://menu.dining.ucla.edu/Menus/BruinPlate",
            2
        );
        console.log(`Found ${bPlateDishes.length} dishes from Bruin Plate`);

        const allDishes = [...epicuriaDishes, ...deNeveDishes, ...bPlateDishes];
        console.log(`Total dishes found: ${allDishes.length}`);

        console.log("Starting to populate database...");
        let processedDishes = 0;
        let skippedDishes = 0;

        for (const dish of allDishes) {
            console.log(`\nChecking dish: ${dish.NAME}`);

            // Check if dish already exists
            const existingDish = await getDishIfExists(
                dish.NAME,
                dish.DINING_HALL_ID + 1
            );

            if (existingDish) {
                console.log(`⏭️  Skipping existing dish: ${dish.NAME}`);
                skippedDishes++;
                continue;
            }

            console.log(`Processing new dish: ${dish.NAME}`);

            // Insert dish
            const { data: dishData, error: dishError } = await supabase
                .from("dishes")
                .insert({
                    name: dish.NAME,
                    recipe_url: dish.RECIPE,
                    dining_hall_id: dish.DINING_HALL_ID + 1,
                })
                .select()
                .single();

            if (dishError) {
                console.error("❌ Error inserting dish:", dishError);
                continue;
            }
            console.log("✓ Dish inserted successfully");

            // Insert ingredients
            const ingredients = dish.INGREDIENTS.split(",")
                .map((i) => i.trim())
                .filter(Boolean);
            console.log(`Processing ${ingredients.length} ingredients...`);

            let successfulIngredients = 0;
            for (const ingredient of ingredients) {
                const ingredientData = await getOrCreateIngredient(ingredient);

                if (!ingredientData) {
                    console.log(
                        `❌ Failed to process ingredient: ${ingredient}`
                    );
                    continue;
                }

                // Create dish-ingredient relationship
                const { error: relationError } = await supabase
                    .from("dish_ingredients")
                    .upsert({
                        dish_id: dishData.id,
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
                `✓ Processed ${successfulIngredients}/${ingredients.length} ingredients`
            );

            // Insert dietary tags
            const dietaryTags = Object.entries(dish["DIETARY TAGS"]).filter(
                ([_, value]) => value
            );
            console.log(`Processing ${dietaryTags.length} dietary tags...`);

            let successfulTags = 0;
            for (const [tag, value] of dietaryTags) {
                // Get tag ID
                const { data: tagData, error: tagError } = await supabase
                    .from("dietary_tags")
                    .select()
                    .eq("code", tag)
                    .single();

                if (tagError) {
                    console.error(
                        `❌ Error getting dietary tag: ${tag}`,
                        tagError
                    );
                    continue;
                }

                // Create dish-tag relationship
                const { error: relationError } = await supabase
                    .from("dish_dietary_tags")
                    .upsert({
                        dish_id: dishData.id,
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

            processedDishes++;
            console.log(
                `Progress: ${processedDishes + skippedDishes}/${
                    allDishes.length
                } dishes (${processedDishes} processed, ${skippedDishes} skipped)`
            );
        }

        console.log("\n✨ Database population completed!");
        console.log(
            `Final count: ${processedDishes} dishes processed, ${skippedDishes} dishes skipped`
        );
    } catch (error) {
        console.error("❌ Fatal error while populating database:", error);
    }
}

populateDatabase();
