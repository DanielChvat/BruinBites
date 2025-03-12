"use client";

import { useAuth } from "@/contexts/AuthContext";
import { saveUserPreferences } from "@/services/userPreferences";
import { useState, useEffect } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";

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
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (showSuccess) {
            timeout = setTimeout(() => {
                setShowSuccess(false);
            }, 2000); // Show success state for 2 seconds
        }
        return () => clearTimeout(timeout);
    }, [showSuccess]);

    const handleSave = async () => {
        if (!user || isSaving) return;

        setIsSaving(true);
        try {
            await saveUserPreferences({
                preferenceFilters: dietaryPreferences,
                allergenFilters: excludedAllergens,
                ingredientFilters: excludedIngredients,
                favoriteDishes: [], // We'll implement this later
            });
            setShowSuccess(true);
        } catch (error) {
            console.error("Error saving preferences:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-ucla-blue hover:bg-ucla-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ucla-blue disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 transition-all duration-200"
        >
            {isSaving ? (
                <span className="flex items-center">
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Saving...
                </span>
            ) : showSuccess ? (
                <span className="flex items-center">
                    <CheckIcon className="h-4 w-4 -ml-1 mr-2" />
                    Saved!
                </span>
            ) : (
                "Save Preferences"
            )}
        </button>
    );
}
