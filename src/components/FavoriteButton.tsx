import { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { addToFavorites, removeFromFavorites, isFavorite } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteButtonProps {
    dishId: number;
    className?: string;
}

export default function FavoriteButton({
    dishId,
    className = "",
}: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { user, signInWithGoogle } = useAuth();

    useEffect(() => {
        console.log("FavoriteButton mounted/updated:", {
            dishId,
            userId: user?.id,
        });
        checkFavoriteStatus();
    }, [dishId, user]);

    const checkFavoriteStatus = async () => {
        if (!user) {
            console.log("No user, setting isFavorited to false");
            setIsFavorited(false);
            setIsLoading(false);
            return;
        }

        console.log("Checking favorite status for:", {
            dishId,
            userId: user.id,
        });
        const favoriteStatus = await isFavorite(dishId, user.id);
        console.log("Favorite status result:", {
            dishId,
            isFavorited: favoriteStatus,
        });
        setIsFavorited(favoriteStatus);
        setIsLoading(false);
    };

    const handleClick = async () => {
        if (!user) {
            console.log("No user, triggering sign in");
            signInWithGoogle();
            return;
        }

        console.log("Handling favorite button click:", {
            dishId,
            currentStatus: isFavorited,
        });
        setIsLoading(true);
        try {
            if (isFavorited) {
                const success = await removeFromFavorites(dishId, user.id);
                console.log("Remove from favorites result:", { success });
                if (success) setIsFavorited(false);
            } else {
                const success = await addToFavorites(dishId, user.id);
                console.log("Add to favorites result:", { success });
                if (success) setIsFavorited(true);
            }
        } catch (error) {
            console.error("Error handling favorite button click:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <button
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
                disabled
            >
                <HeartIcon className="w-6 h-6 text-gray-400" />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
            title={
                !user
                    ? "Sign in to add favorites"
                    : isFavorited
                    ? "Remove from favorites"
                    : "Add to favorites"
            }
        >
            {isFavorited ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
            ) : (
                <HeartIcon className="w-6 h-6 text-gray-400" />
            )}
        </button>
    );
}
