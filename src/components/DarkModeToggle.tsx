import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import {
    saveThemePreference,
    getUserPreferences,
} from "@/services/userPreferences";

export default function DarkModeToggle() {
    const [darkMode, setDarkMode] = useState<boolean | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        async function loadUserPreference() {
            if (user) {
                try {
                    const preferences = await getUserPreferences();
                    if (preferences?.theme) {
                        setDarkMode(preferences.theme === "dark");
                        return;
                    }
                } catch (error) {
                    console.error("Error loading theme preference:", error);
                }
            }

            // If no user preference found, check localStorage and system preference
            const savedDarkMode = localStorage.getItem("darkMode");
            if (savedDarkMode !== null) {
                setDarkMode(savedDarkMode === "true");
            } else {
                const prefersDark = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches;
                setDarkMode(prefersDark);
            }
        }

        loadUserPreference();
    }, [user]);

    useEffect(() => {
        // Only update when darkMode is not null (initial load complete)
        if (darkMode !== null) {
            // Update localStorage and document class when darkMode changes
            localStorage.setItem("darkMode", darkMode.toString());
            if (darkMode) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }

            // Only save to database if it's not the initial load and user is logged in
            if (!isInitialLoad && user) {
                saveThemePreference(darkMode ? "dark" : "light").catch(
                    (error) => {
                        console.error("Error saving theme preference:", error);
                    }
                );
            }
        }
    }, [darkMode, user, isInitialLoad]);

    // Don't render anything until we've loaded the initial preference
    if (darkMode === null) {
        return null;
    }

    return (
        <button
            onClick={() => {
                setIsInitialLoad(false);
                setDarkMode(!darkMode);
            }}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Toggle dark mode"
        >
            {darkMode ? (
                <SunIcon className="h-5 w-5" />
            ) : (
                <MoonIcon className="h-5 w-5" />
            )}
        </button>
    );
}
