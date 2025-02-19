import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from the root .env file
config({ path: resolve(__dirname, "../.env") });

import { supabase } from "../src/lib/supabase";

async function clearDatabase() {
    try {
        console.log("🗑️  Starting database cleanup...");

        // Clear junction tables first
        console.log("\nClearing junction tables...");
        const { error: dishIngredientsError } = await supabase
            .from("dish_ingredients")
            .delete()
            .neq("dish_id", 0); // Delete all rows

        if (dishIngredientsError) {
            console.error(
                "❌ Error clearing dish_ingredients:",
                dishIngredientsError
            );
            return;
        }
        console.log("✓ Cleared dish_ingredients table");

        const { error: dishDietaryTagsError } = await supabase
            .from("dish_dietary_tags")
            .delete()
            .neq("dish_id", 0); // Delete all rows

        if (dishDietaryTagsError) {
            console.error(
                "❌ Error clearing dish_dietary_tags:",
                dishDietaryTagsError
            );
            return;
        }
        console.log("✓ Cleared dish_dietary_tags table");

        // Clear dishes table
        console.log("\nClearing dishes table...");
        const { error: dishesError } = await supabase
            .from("dishes")
            .delete()
            .neq("id", 0); // Delete all rows

        if (dishesError) {
            console.error("❌ Error clearing dishes:", dishesError);
            return;
        }
        console.log("✓ Cleared dishes table");

        // Clear ingredients table
        console.log("\nClearing ingredients table...");
        const { error: ingredientsError } = await supabase
            .from("ingredients")
            .delete()
            .neq("id", 0); // Delete all rows

        if (ingredientsError) {
            console.error("❌ Error clearing ingredients:", ingredientsError);
            return;
        }
        console.log("✓ Cleared ingredients table");

        // Note: We don't clear dining_halls and dietary_tags as they are reference tables

        console.log("\n✨ Database cleanup completed successfully!");
        console.log(
            "You can now run 'npm run populate-db' to repopulate the database."
        );
    } catch (error) {
        console.error("❌ Fatal error while clearing database:", error);
    }
}

clearDatabase();
