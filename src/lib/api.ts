import { supabase } from "./supabase";
import type { DiningHall, Dish, DietaryTag } from "./supabase";

export async function getDishes(
    diningHallCode: string,
    selectedTags: string[] = [],
    excludedIngredients: string[] = []
): Promise<Dish[]> {
    // Normalize excluded ingredients once
    const normalizedExcludedIngredients = new Set(
        excludedIngredients.map((i) => i.toLowerCase())
    );

    let query = supabase
        .from("dishes")
        .select(
            `
            *,
            dining_halls!inner(code),
            dish_dietary_tags!inner(
                dietary_tags!inner(code)
            ),
            dish_ingredients!left(
                ingredients!inner(name)
            )
        `
        )
        .eq("dining_halls.code", diningHallCode);

    if (selectedTags.length > 0) {
        query = query.in("dish_dietary_tags.dietary_tags.code", selectedTags);
    }

    const { data: allDishes, error: dishError } = await query;

    if (dishError) {
        console.error("Error fetching dishes:", dishError);
        return [];
    }

    // Transform and filter the data
    return allDishes
        .map((dish: any) => ({
            ...dish,
            dietary_tags: (dish.dish_dietary_tags || [])
                .map((tag: any) => tag.dietary_tags?.code)
                .filter(Boolean),
            ingredients: (dish.dish_ingredients || [])
                .map((ingredient: any) => ingredient.ingredients?.name)
                .filter(Boolean),
        }))
        .filter(
            (dish) =>
                normalizedExcludedIngredients.size === 0 ||
                !dish.ingredients.some((ingredient: string) =>
                    normalizedExcludedIngredients.has(ingredient.toLowerCase())
                )
        );
}

export async function getDietaryTags(): Promise<DietaryTag[]> {
    const { data, error } = await supabase.from("dietary_tags").select("*");

    if (error) {
        console.error("Error fetching dietary tags:", error);
        return [];
    }

    return data;
}

export async function getAllIngredients(): Promise<string[]> {
    const { data, error } = await supabase
        .from("ingredients")
        .select("name")
        .order("name");

    if (error) {
        console.error("Error fetching ingredients:", error);
        return [];
    }

    return data.map((ingredient) => ingredient.name);
}
