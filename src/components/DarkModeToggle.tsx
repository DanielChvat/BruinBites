import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function DarkModeToggle() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Check if user has a preference in localStorage
        const savedDarkMode = localStorage.getItem("darkMode");
        if (savedDarkMode !== null) {
            setDarkMode(savedDarkMode === "true");
        } else {
            // Check system preference
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;
            setDarkMode(prefersDark);
        }
    }, []);

    useEffect(() => {
        // Update localStorage and document class when darkMode changes
        localStorage.setItem("darkMode", darkMode.toString());
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
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
