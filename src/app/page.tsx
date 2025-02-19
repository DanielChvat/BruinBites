"use client";

import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { Combobox } from "@headlessui/react";
import type { Dish, DietaryTag } from "@/lib/supabase";
import {
    getDishes,
    getDietaryTags,
    getAllIngredients,
    PREFERENCE_TAGS,
    ALLERGEN_TAGS,
} from "@/lib/api";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function Home() {
    const [selectedDiningHall, setSelectedDiningHall] =
        useState<string>("EPICURIA");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [excludedIngredients, setExcludedIngredients] = useState<string[]>(
        []
    );
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
    const [allIngredients, setAllIngredients] = useState<string[]>([]);
    const [ingredientQuery, setIngredientQuery] = useState("");
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
        async function fetchIngredients() {
            const ingredients = await getAllIngredients();
            setAllIngredients(ingredients);
        }
        fetchDietaryTags();
        fetchIngredients();
    }, []);

    useEffect(() => {
        async function fetchDishes() {
            setLoading(true);
            const newDishes = await getDishes(
                selectedDiningHall,
                selectedTags,
                excludedIngredients
            );
            setDishes(newDishes);
            setLoading(false);
        }
        fetchDishes();
    }, [selectedDiningHall, selectedTags, excludedIngredients]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const removeIngredient = (ingredient: string) => {
        setExcludedIngredients((prev) => prev.filter((i) => i !== ingredient));
    };

    const clearPreferenceTags = () => {
        setSelectedTags((prev) =>
            prev.filter((tag) => !PREFERENCE_TAGS.has(tag))
        );
    };

    const clearAllergenTags = () => {
        setSelectedTags((prev) =>
            prev.filter((tag) => !ALLERGEN_TAGS.has(tag))
        );
    };

    const clearAllFilters = () => {
        setSelectedTags([]);
        setExcludedIngredients([]);
    };

    const filteredIngredients =
        ingredientQuery === ""
            ? allIngredients
            : allIngredients.filter((ingredient) =>
                  ingredient
                      .toLowerCase()
                      .includes(ingredientQuery.toLowerCase())
              );

    // Group dietary tags by type
    const preferenceTags = dietaryTags.filter((tag) => tag.isPreference);
    const allergenTags = dietaryTags.filter((tag) => tag.isAllergen);

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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Dietary Preferences
                    </h2>
                    {selectedTags.some((tag) => PREFERENCE_TAGS.has(tag)) && (
                        <button
                            onClick={clearPreferenceTags}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear preferences
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {preferenceTags.map((tag) => (
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

            <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Exclude Allergens
                    </h2>
                    {selectedTags.some((tag) => ALLERGEN_TAGS.has(tag)) && (
                        <button
                            onClick={clearAllergenTags}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear allergens
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {allergenTags.map((tag) => (
                        <button
                            key={tag.code}
                            onClick={() => toggleTag(tag.code)}
                            className={classNames(
                                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                                selectedTags.includes(tag.code)
                                    ? "bg-red-600 text-white"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                            )}
                            title={`Exclude dishes that ${tag.description.toLowerCase()}`}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Exclude Ingredients
                    </h2>
                    {excludedIngredients.length > 0 && (
                        <button
                            onClick={() => setExcludedIngredients([])}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear ingredients
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {excludedIngredients.map((ingredient) => (
                        <span
                            key={ingredient}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                        >
                            {ingredient}
                            <button
                                onClick={() => removeIngredient(ingredient)}
                                className="hover:text-red-900"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <Combobox
                    value=""
                    onChange={(ingredient) => {
                        if (
                            ingredient &&
                            !excludedIngredients.includes(ingredient)
                        ) {
                            setExcludedIngredients((prev) => [
                                ...prev,
                                ingredient,
                            ]);
                        }
                    }}
                >
                    <div className="relative">
                        <Combobox.Input
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-ucla-blue focus:ring-ucla-blue"
                            placeholder="Type to search ingredients..."
                            onChange={(event) =>
                                setIngredientQuery(event.target.value)
                            }
                        />
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredIngredients.map((ingredient) => (
                                <Combobox.Option
                                    key={ingredient}
                                    value={ingredient}
                                    className={({ active }) =>
                                        classNames(
                                            "relative cursor-pointer select-none py-2 pl-3 pr-9",
                                            active
                                                ? "bg-ucla-blue text-white"
                                                : "text-gray-900"
                                        )
                                    }
                                >
                                    {ingredient}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    </div>
                </Combobox>
            </div>

            <div className="mt-8 space-y-4">
                {(selectedTags.length > 0 ||
                    excludedIngredients.length > 0) && (
                    <div className="flex justify-end">
                        <button
                            onClick={clearAllFilters}
                            className="text-sm text-ucla-blue hover:text-ucla-blue/80 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
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
                                    {dish.dietary_tags.map((tagCode) => {
                                        const tag = dietaryTags.find(
                                            (t) => t.code === tagCode
                                        );
                                        if (!tag) return null;
                                        return (
                                            <span
                                                key={tagCode}
                                                className={classNames(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                                    tag.isPreference
                                                        ? "bg-ucla-blue/10 text-ucla-blue"
                                                        : "bg-red-100 text-red-700"
                                                )}
                                                title={tag.description}
                                            >
                                                {tag.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            {dish.ingredients && (
                                <div className="mt-2 text-sm text-gray-500">
                                    {dish.ingredients.join(", ")}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
