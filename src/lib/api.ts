import { supabase } from "./supabase";
import type { DiningHall, Dish, DietaryTag } from "./supabase";

// Dietary tags that should show only matching dishes
export const PREFERENCE_TAGS = new Set(["V", "VG", "HAL", "LC", "HC"]);

// Dietary tags that should exclude dishes (allergens/warnings)
export const ALLERGEN_TAGS = new Set([
    "APNT",
    "ATNT",
    "AWHT",
    "AGTN",
    "ASOY",
    "ASES",
    "AMLK",
    "AEGG",
    "ACSF",
    "AFSH",
    "AALC",
]);

export async function getDishes(
    diningHallCode: string,
    selectedTags: string[] = [],
    excludedIngredients: string[] = []
): Promise<Dish[]> {
    // Normalize excluded ingredients once
    const normalizedExcludedIngredients = new Set(
        excludedIngredients.map((i) => i.toLowerCase())
    );

    // Split selected tags into preferences and allergens
    const preferenceTags = selectedTags.filter((tag) =>
        PREFERENCE_TAGS.has(tag)
    );
    const allergenTags = selectedTags.filter((tag) => ALLERGEN_TAGS.has(tag));

    let query = supabase
        .from("dishes")
        .select(
            `
            *,
            dining_halls!dishes_dining_hall_id_fkey(code),
            dish_dietary_tags!inner(
                dietary_tags!inner(code)
            ),
            dish_ingredients!left(
                ingredients!inner(name)
            )
        `
        )
        .eq("dining_halls.code", diningHallCode);

    // If preference tags are selected, show only dishes with those tags
    if (preferenceTags.length > 0) {
        query = query.in("dish_dietary_tags.dietary_tags.code", preferenceTags);
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
        .filter((dish) => {
            // Filter out dishes with selected allergen tags
            if (
                allergenTags.length > 0 &&
                dish.dietary_tags.some((tag: string) =>
                    allergenTags.includes(tag)
                )
            ) {
                return false;
            }

            // Filter out dishes with excluded ingredients
            if (
                normalizedExcludedIngredients.size > 0 &&
                dish.ingredients.some((ingredient: string) =>
                    normalizedExcludedIngredients.has(ingredient.toLowerCase())
                )
            ) {
                return false;
            }

            return true;
        });
}

export async function getDietaryTags(): Promise<DietaryTag[]> {
    const { data, error } = await supabase
        .from("dietary_tags")
        .select("*")
        .order("code");

    if (error) {
        console.error("Error fetching dietary tags:", error);
        return [];
    }

    // Transform the tags to indicate their type
    return data.map((tag) => ({
        ...tag,
        isAllergen: ALLERGEN_TAGS.has(tag.code),
        isPreference: PREFERENCE_TAGS.has(tag.code),
    }));
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
