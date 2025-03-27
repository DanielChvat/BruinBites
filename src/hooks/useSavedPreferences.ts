"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    getUserPreferences,
    UserPreferences,
} from "@/services/userPreferences";

export function useSavedPreferences() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPreferences() {
            if (!user) {
                setPreferences(null);
                setLoading(false);
                return;
            }

            try {
                const savedPreferences = await getUserPreferences();
                setPreferences(savedPreferences);
            } catch (error) {
                console.error("Error loading preferences:", error);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [user]);

    return { preferences, loading };
}
