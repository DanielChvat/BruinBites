"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface UserPreferences {
    preferenceFilters: string[];
    allergenFilters: string[];
    ingredientFilters: string[];
    favoriteDishes: string[];
    theme?: "light" | "dark";
}

const supabase = createClientComponentClient();

export async function saveUserPreferences(preferences: UserPreferences) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user)
        throw new Error("User must be authenticated to save preferences");

    const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        preference_filters: preferences.preferenceFilters,
        allergen_filters: preferences.allergenFilters,
        ingredient_filters: preferences.ingredientFilters,
        favorite_dishes: preferences.favoriteDishes,
        theme: preferences.theme,
        updated_at: new Date().toISOString(),
    });

    if (error) throw error;
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error) throw error;

    if (!data) return null;

    return {
        preferenceFilters: data.preference_filters || [],
        allergenFilters: data.allergen_filters || [],
        ingredientFilters: data.ingredient_filters || [],
        favoriteDishes: data.favorite_dishes || [],
        theme: data.theme,
    };
}

export async function updateUserPreferences(updates: Partial<UserPreferences>) {
    const currentPreferences = await getUserPreferences();
    if (!currentPreferences) {
        return saveUserPreferences(updates as UserPreferences);
    }

    const updatedPreferences = {
        ...currentPreferences,
        ...updates,
    };

    return saveUserPreferences(updatedPreferences);
}

export async function saveThemePreference(theme: "light" | "dark") {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user)
        throw new Error("User must be authenticated to save theme preference");

    const { error } = await supabase.from("user_preferences").upsert(
        {
            user_id: user.id,
            theme,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "user_id",
        }
    );

    if (error) throw error;
    return true;
}
