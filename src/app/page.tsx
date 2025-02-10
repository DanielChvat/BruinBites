"use client";

import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import type { Dish, DietaryTag } from "@/lib/supabase";
import { getDishes, getDietaryTags } from "@/lib/api";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function Home() {
    const [selectedDiningHall, setSelectedDiningHall] =
        useState<string>("EPICURIA");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
    const [loading, setLoading] = useState(true);

    const diningHalls = [
        { name: "Epicuria", code: "EPICURIA" },
        { name: "De Neve", code: "DENEVE" },
        { name: "Bruin Plate", code: "BRUINPLATE" },
    ];

    useEffect(() => {
        async function fetchDietaryTags() {
            const tags = await getDietaryTags();
            setDietaryTags(tags);
        }
        fetchDietaryTags();
    }, []);

    useEffect(() => {
        async function fetchDishes() {
            setLoading(true);
            const newDishes = await getDishes(selectedDiningHall, selectedTags);
            setDishes(newDishes);
            setLoading(false);
        }
        fetchDishes();
    }, [selectedDiningHall, selectedTags]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-ucla-blue/10 p-1">
                    {diningHalls.map((hall) => (
                        <Tab
                            key={hall.code}
                            className={({ selected }) =>
                                classNames(
                                    "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                                    "ring-white/60 ring-offset-2 ring-offset-ucla-blue focus:outline-none focus:ring-2",
                                    selected
                                        ? "bg-white text-ucla-blue shadow"
                                        : "text-ucla-blue hover:bg-white/[0.12] hover:text-ucla-blue"
                                )
                            }
                            onClick={() => setSelectedDiningHall(hall.code)}
                        >
                            {hall.name}
                        </Tab>
                    ))}
                </Tab.List>
            </Tab.Group>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    Dietary Preferences
                </h2>
                <div className="flex flex-wrap gap-2">
                    {dietaryTags.map((tag) => (
                        <button
                            key={tag.code}
                            onClick={() => toggleTag(tag.code)}
                            className={classNames(
                                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                                selectedTags.includes(tag.code)
                                    ? "bg-ucla-blue text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            )}
                            title={tag.description}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucla-blue mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading dishes...</p>
                    </div>
                ) : dishes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-600">
                            No dishes found with the selected filters
                        </p>
                    </div>
                ) : (
                    dishes.map((dish) => (
                        <div
                            key={dish.id}
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        >
                            <h3 className="text-xl font-medium text-gray-900">
                                {dish.name}
                            </h3>
                            {dish.dietary_tags && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {dish.dietary_tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full bg-ucla-blue/10 text-ucla-blue text-xs font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {dish.ingredients && (
                                <p className="mt-3 text-sm text-gray-600">
                                    <span className="font-medium">
                                        Ingredients:
                                    </span>{" "}
                                    {dish.ingredients.join(", ")}
                                </p>
                            )}
                            {dish.recipe_url && (
                                <a
                                    href={dish.recipe_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center text-sm text-ucla-blue hover:text-ucla-blue/80"
                                >
                                    View Recipe →
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
