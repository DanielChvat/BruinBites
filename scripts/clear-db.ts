import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from the root .env file
config({ path: resolve(__dirname, "../.env") });

import { supabase } from "../src/lib/supabase";

async function clearDatabase() {
    console.log("🗑️  Starting database cleanup...\n");

    console.log("Clearing junction tables...");

    // Clear dish_meal_periods first
    const { error: mealPeriodsError } = await supabase
        .from("dish_meal_periods")
        .delete()
        .gte("dish_id", 0);
    if (mealPeriodsError) {
        console.error("❌ Error clearing dish_meal_periods:", mealPeriodsError);
    } else {
        console.log("✓ Cleared dish_meal_periods table");
    }

    // Clear other junction tables
    const { error: ingredientsError } = await supabase
        .from("dish_ingredients")
        .delete()
        .gte("dish_id", 0);
    if (ingredientsError) {
        console.error("❌ Error clearing dish_ingredients:", ingredientsError);
    } else {
        console.log("✓ Cleared dish_ingredients table");
    }

    const { error: tagsError } = await supabase
        .from("dish_dietary_tags")
        .delete()
        .gte("dish_id", 0);
    if (tagsError) {
        console.error("❌ Error clearing dish_dietary_tags:", tagsError);
    } else {
        console.log("✓ Cleared dish_dietary_tags table");
    }

    console.log("\nClearing main tables...");

    // Now clear the dishes table
    const { error: dishesError } = await supabase
        .from("dishes")
        .delete()
        .gte("id", 0);
    if (dishesError) {
        console.error("❌ Error clearing dishes:", dishesError);
    } else {
        console.log("✓ Cleared dishes table");
    }

    // Clear ingredients
    const { error: ingredientsTableError } = await supabase
        .from("ingredients")
        .delete()
        .gte("id", 0);
    if (ingredientsTableError) {
        console.error(
            "❌ Error clearing ingredients table:",
            ingredientsTableError
        );
    } else {
        console.log("✓ Cleared ingredients table");
    }

    console.log("\n✨ Database cleanup completed!");
}

clearDatabase();
