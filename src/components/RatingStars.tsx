"use client";

import { StarIcon } from "@heroicons/react/20/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rateDish } from "@/lib/api";

interface RatingStarsProps {
    dishId: number;
    averageRating: number;
    ratingCount: number;
    userRating?: number;
    onRatingChange?: (newRating: number) => void;
}

export default function RatingStars({
    dishId,
    averageRating,
    ratingCount,
    userRating,
    onRatingChange,
}: RatingStarsProps) {
    const { user } = useAuth();
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRatingClick = async (rating: number) => {
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const success = await rateDish(dishId, rating, user.id);
            if (success && onRatingChange) {
                onRatingChange(rating);
            }
        } catch (error) {
            console.error("Error rating dish:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayRating = hoveredRating ?? userRating ?? averageRating;

    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[1, 2, 3, 4, 5].map((rating) => {
                    const isHovered = hoveredRating !== null;
                    const isActive = rating <= displayRating;
                    const isInteractive = user && !isSubmitting;

                    return (
                        <button
                            key={rating}
                            type="button"
                            disabled={!isInteractive}
                            className={`p-0.5 ${
                                isInteractive
                                    ? "cursor-pointer hover:scale-110 transition-transform"
                                    : "cursor-default"
                            }`}
                            onMouseEnter={() =>
                                isInteractive && setHoveredRating(rating)
                            }
                            onMouseLeave={() =>
                                isInteractive && setHoveredRating(null)
                            }
                            onClick={() =>
                                isInteractive && handleRatingClick(rating)
                            }
                        >
                            {isActive ? (
                                <StarIcon
                                    className={`h-5 w-5 ${
                                        isHovered
                                            ? "text-yellow-400"
                                            : "text-yellow-500"
                                    }`}
                                />
                            ) : (
                                <StarOutlineIcon
                                    className={`h-5 w-5 ${
                                        isHovered
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                    }`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            <span className="text-sm text-gray-500">
                ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
            </span>
        </div>
    );
}
