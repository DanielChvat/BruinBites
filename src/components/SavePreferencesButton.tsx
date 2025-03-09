"use client";

import { useAuth } from "@/contexts/AuthContext";
import { saveUserPreferences } from "@/services/userPreferences";
import { useState } from "react";

interface SavePreferencesButtonProps {
    dietaryPreferences: string[];
    excludedAllergens: string[];
    excludedIngredients: string[];
}

export default function SavePreferencesButton({
    dietaryPreferences,
    excludedAllergens,
    excludedIngredients,
}: SavePreferencesButtonProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(
        null
    );

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveStatus(null);

        try {
            await saveUserPreferences({
                preferenceFilters: dietaryPreferences,
                allergenFilters: excludedAllergens,
                ingredientFilters: excludedIngredients,
                favoriteDishes: [], // We'll implement this later
            });
            setSaveStatus("success");
        } catch (error) {
            console.error("Error saving preferences:", error);
            setSaveStatus("error");
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-ucla-blue hover:bg-ucla-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ucla-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? "Saving..." : "Save Preferences"}
            </button>
            {saveStatus === "success" && (
                <span className="text-sm text-green-600">
                    Preferences saved!
                </span>
            )}
            {saveStatus === "error" && (
                <span className="text-sm text-red-600">
                    Failed to save preferences
                </span>
            )}
        </div>
    );
}
