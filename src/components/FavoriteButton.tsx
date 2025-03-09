import { useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { addToFavorites, removeFromFavorites } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteButtonProps {
    dishId: number;
    initialIsFavorite?: boolean;
}

export default function FavoriteButton({
    dishId,
    initialIsFavorite = false,
}: FavoriteButtonProps) {
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);

    const toggleFavorite = async () => {
        if (!user || isLoading) return;

        setIsLoading(true);
        try {
            const success = isFavorite
                ? await removeFromFavorites(dishId, user.id)
                : await addToFavorites(dishId, user.id);

            if (success) {
                setIsFavorite(!isFavorite);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
            }
        >
            {isFavorite ? (
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
            ) : (
                <HeartIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 hover:text-red-500" />
            )}
        </button>
    );
}
