import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface UserPreferences {
    preferenceFilters: string[];
    ingredientFilters: string[];
    favoriteDishes: string[];
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
        ...preferences,
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
    return data;
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
