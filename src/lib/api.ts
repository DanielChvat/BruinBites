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

function getDiningHallId(diningHallCode: string): number {
    switch (diningHallCode.toUpperCase()) {
        case "EPICURIA":
            return 1;
        case "DENEVE":
            return 2;
        case "BRUINPLATE":
            return 3;
        default:
            return 0;
    }
}

function getCurrentMealPeriod(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;

    // Match the meal periods from the database
    if (time < 10 * 60) return "Breakfast"; // 12am-10am
    if (time < 15 * 60) return "Lunch"; // 10am-3pm
    return "Dinner"; // 3pm-12am
}

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

    const currentMealPeriod = getCurrentMealPeriod();
    const pdtDate = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
    });
    const today = new Date(pdtDate).toISOString().split("T")[0];

    console.log("Fetching dishes with params:", {
        diningHallCode,
        currentMealPeriod,
        today,
        preferenceTags,
        allergenTags,
    });

    // Debug query to see what's in dish_meal_periods
    const { data: debugMealPeriods, error: debugError } = await supabase
        .from("dish_meal_periods")
        .select(
            `
            *,
            meal_periods(name),
            dishes(name),
            dining_halls(code)
        `
        )
        .eq("dining_hall_id", getDiningHallId(diningHallCode))
        .order("date", { ascending: false })
        .limit(5);

    console.log("Debug meal periods:", {
        data: debugMealPeriods,
        error: debugError,
        sample: debugMealPeriods?.[0],
        diningHallCode,
        diningHallId: getDiningHallId(diningHallCode),
    });

    // Debug query to see what's in meal_periods table
    const { data: allMealPeriods, error: allMealPeriodsError } = await supabase
        .from("meal_periods")
        .select("*");

    console.log("All meal periods:", {
        data: allMealPeriods,
        error: allMealPeriodsError,
        names: allMealPeriods?.map((mp: any) => mp.name),
    });

    // First, let's get all dishes without date/meal period filters
    let query = supabase
        .from("dishes")
        .select(
            `
            *,
            dining_halls!dishes_dining_hall_id_fkey(code),
            dish_dietary_tags!left(
                dietary_tags!left(code)
            ),
            dish_ingredients!left(
                ingredients!left(name)
            ),
            dish_meal_periods!left(
                meal_period_id,
                dining_hall_id,
                date,
                meal_periods!left(name)
            )
        `
        )
        .eq("dining_halls.code", diningHallCode);

    // If preference tags are selected, show only dishes with those tags
    if (preferenceTags.length > 0) {
        // Get dishes that have at least one of the selected preference tags
        const { data: dishesWithTags } = await supabase
            .from("dish_dietary_tags")
            .select(
                `
                dish_id,
                dietary_tags!inner(code)
            `
            )
            .in("dietary_tags.code", preferenceTags);

        if (dishesWithTags && dishesWithTags.length > 0) {
            const dishIds = dishesWithTags.map((d) => d.dish_id);
            query = query.in("id", dishIds);
        }
    }

    console.log("Executing main query...");
    const { data: allDishes, error: dishError } = await query;

    if (dishError) {
        console.error("Error fetching dishes:", dishError);
        return [];
    }

    console.log("Query results:", {
        totalDishes: allDishes?.length || 0,
        firstDish: allDishes?.[0],
        error: dishError,
        dishesWithMealPeriods:
            allDishes?.filter((d) => d.dish_meal_periods?.length > 0).length ||
            0,
        sampleDish: allDishes?.[0]
            ? {
                  name: allDishes[0].name,
                  dining_hall: allDishes[0].dining_halls?.code,
                  meal_periods: allDishes[0].dish_meal_periods?.map(
                      (mp: any) => ({
                          date: mp.date,
                          meal_period: mp.meal_periods?.name,
                          dining_hall_id: mp.dining_hall_id,
                      })
                  ),
              }
            : null,
        uniqueDates: Array.from(
            new Set(
                allDishes?.flatMap(
                    (d) =>
                        d.dish_meal_periods?.map(
                            (mp: { date: string }) => mp.date
                        ) || []
                )
            )
        ).sort(),
        today,
        currentMealPeriod,
    });

    // Transform and filter the data
    const transformedDishes = allDishes
        .map((dish: any) => ({
            ...dish,
            dietary_tags: (dish.dish_dietary_tags || [])
                .map((tag: any) => tag.dietary_tags?.code)
                .filter(Boolean),
            ingredients: (dish.dish_ingredients || [])
                .map((ingredient: any) => ingredient.ingredients?.name)
                .filter(Boolean),
            meal_periods: (dish.dish_meal_periods || [])
                .map((period: any) => period.meal_periods?.name)
                .filter(Boolean),
        }))
        .filter((dish) => {
            // Only include dishes that have a meal period for today and current meal period
            const hasMealPeriod = dish.dish_meal_periods?.some(
                (period: any) => {
                    const matches =
                        period.date === today &&
                        period.meal_periods?.name === currentMealPeriod &&
                        period.dining_hall_id ===
                            getDiningHallId(diningHallCode);
                    if (!matches) {
                        console.log("Dish filtered out:", {
                            name: dish.name,
                            date: period.date,
                            expected_date: today,
                            period_name: period.meal_periods?.name,
                            expected_period: currentMealPeriod,
                            dining_hall_id: period.dining_hall_id,
                            expected_dining_hall_id:
                                getDiningHallId(diningHallCode),
                            date_matches: period.date === today,
                            period_matches:
                                period.meal_periods?.name === currentMealPeriod,
                            dining_hall_matches:
                                period.dining_hall_id ===
                                getDiningHallId(diningHallCode),
                        });
                    }
                    return matches;
                }
            );

            if (!hasMealPeriod) {
                return false;
            }

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

    console.log("Final filtered dishes:", {
        totalFiltered: transformedDishes.length,
        firstFilteredDish: transformedDishes[0],
        uniqueDates: Array.from(
            new Set(
                transformedDishes.flatMap(
                    (d) =>
                        d.dish_meal_periods?.map(
                            (mp: { date: string }) => mp.date
                        ) || []
                )
            )
        ).sort(),
    });

    return transformedDishes;
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
