import { supabase } from "./supabase";
import type { DiningHall, Dish, DietaryTag } from "./supabase";

export async function getDishes(
    diningHallCode: string,
    selectedTags: string[] = []
): Promise<Dish[]> {
    // First, get all dishes for the dining hall
    const { data: allDishes, error: dishError } = await supabase
        .from("dishes")
        .select(
            `
            *,
            dining_halls!inner(code),
            dish_dietary_tags(
                dietary_tags(code)
            ),
            dish_ingredients(
                ingredients(name)
            )
            `
        )
        .eq("dining_halls.code", diningHallCode);

    if (dishError) {
        console.error("Error fetching dishes:", dishError);
        return [];
    }

    // Transform the data
    const transformedDishes = allDishes.map((dish: any) => ({
        ...dish,
        dietary_tags: (dish.dish_dietary_tags || [])
            .map((tag: any) => tag.dietary_tags?.code)
            .filter(Boolean),
        ingredients: (dish.dish_ingredients || [])
            .map((ingredient: any) => ingredient.ingredients?.name)
            .filter(Boolean),
    }));

    // If no tags selected, return all dishes
    if (selectedTags.length === 0) {
        return transformedDishes;
    }

    // Filter dishes that have all selected tags
    return transformedDishes.filter((dish) =>
        selectedTags.every((tag) => dish.dietary_tags.includes(tag))
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
