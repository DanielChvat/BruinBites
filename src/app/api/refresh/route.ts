import { NextResponse } from "next/server";
import { getDishes } from "../../../../scripts/scraper";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        // Verify the secret to ensure only authorized refreshes
        const authHeader = request.headers.get("authorization");
        const secret = process.env.CRON_SECRET;

        if (!secret || authHeader !== `Bearer ${secret}`) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch new data from dining halls
        const epicuriaDishes = await getDishes(
            "https://menu.dining.ucla.edu/Menus/Epicuria",
            0
        );
        const deNeveDishes = await getDishes(
            "https://menu.dining.ucla.edu/Menus/DeNeve",
            1
        );
        const bPlateDishes = await getDishes(
            "https://menu.dining.ucla.edu/Menus/BruinPlate",
            2
        );

        const allDishes = [...epicuriaDishes, ...deNeveDishes, ...bPlateDishes];

        // Process each dish
        for (const dish of allDishes) {
            // Check if dish already exists
            const { data: existingDish } = await supabase
                .from("dishes")
                .select("id")
                .eq("name", dish.NAME)
                .eq("dining_hall_id", dish.DINING_HALL_ID + 1)
                .single();

            if (!existingDish) {
                // Insert new dish
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
                    console.error("Error inserting dish:", dishError);
                    continue;
                }

                // Process ingredients
                const ingredients = dish.INGREDIENTS.split(",").map(
                    (i: string) => i.trim()
                );
                for (const ingredientName of ingredients) {
                    // Get or create ingredient
                    const { data: ingredient } = await supabase
                        .from("ingredients")
                        .select()
                        .eq("name", ingredientName)
                        .single();

                    const ingredientId =
                        ingredient?.id ||
                        (
                            await supabase
                                .from("ingredients")
                                .insert({ name: ingredientName })
                                .select()
                                .single()
                        ).data?.id;

                    if (ingredientId) {
                        // Create dish-ingredient relationship
                        await supabase.from("dish_ingredients").upsert({
                            dish_id: dishData.id,
                            ingredient_id: ingredientId,
                        });
                    }
                }

                // Process dietary tags
                const dietaryTags = Object.entries(dish["DIETARY TAGS"])
                    .filter(([_, value]) => value)
                    .map(([tag]) => tag);

                for (const tagCode of dietaryTags) {
                    const { data: tag } = await supabase
                        .from("dietary_tags")
                        .select()
                        .eq("code", tagCode)
                        .single();

                    if (tag) {
                        await supabase.from("dish_dietary_tags").upsert({
                            dish_id: dishData.id,
                            tag_id: tag.id,
                        });
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error refreshing data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
