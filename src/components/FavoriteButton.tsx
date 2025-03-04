import { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { addToFavorites, removeFromFavorites, isFavorite } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import LoginButton from "./LoginButton";

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
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthAndFavoriteStatus();
    }, [dishId]);

    const checkAuthAndFavoriteStatus = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        if (user) {
            const favoriteStatus = await isFavorite(dishId);
            setIsFavorited(favoriteStatus);
        }
        setIsLoading(false);
    };

    const handleClick = async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        try {
            if (isFavorited) {
                const success = await removeFromFavorites(dishId);
                if (success) setIsFavorited(false);
            } else {
                const success = await addToFavorites(dishId);
                if (success) setIsFavorited(true);
            }
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

    if (!isAuthenticated) {
        return (
            <LoginButton>
                <div className={className}>
                    <HeartIcon className="w-6 h-6 text-gray-400" />
                </div>
            </LoginButton>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
            {isFavorited ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
            ) : (
                <HeartIcon className="w-6 h-6 text-gray-400" />
            )}
        </button>
    );
}
