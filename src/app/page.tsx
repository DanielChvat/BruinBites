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
import SavePreferencesButton from "@/components/SavePreferencesButton";
import { useSavedPreferences } from "@/hooks/useSavedPreferences";
import FavoriteButton from "@/components/FavoriteButton";
import { useAuth } from "@/contexts/AuthContext";
import RatingStars from "@/components/RatingStars";

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
    const [currentMealPeriod, setCurrentMealPeriod] = useState<string>("");
    const { preferences, loading: loadingPreferences } = useSavedPreferences();
    const { user } = useAuth();

    const diningHalls = [
        { name: "Epicuria", code: "EPICURIA" },
        { name: "De Neve", code: "DENEVE" },
        { name: "Bruin Plate", code: "BRUINPLATE" },
    ];

    useEffect(() => {
        function updateMealPeriod() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const time = hours * 60 + minutes;

            console.log(`Current time: ${hours}:${minutes} (${time} minutes)`);

            // Match the meal periods from the database
            let period;
            if (time < 10 * 60) period = "Breakfast"; // 12am-10am
            else if (time < 15 * 60) period = "Lunch"; // 10am-3pm
            else period = "Dinner"; // 3pm-12am

            setCurrentMealPeriod(period);
        }

        // Run immediately
        updateMealPeriod();

        // Update every minute
        const interval = setInterval(updateMealPeriod, 60000);

        return () => clearInterval(interval);
    }, []);

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
                excludedIngredients,
                user?.id
            );
            setDishes(newDishes);
            setLoading(false);
        }
        fetchDishes();
    }, [selectedDiningHall, selectedTags, excludedIngredients, user?.id]);

    // Load saved preferences when they become available
    useEffect(() => {
        if (preferences && !loadingPreferences) {
            // Load preference filters
            setSelectedTags(preferences.preferenceFilters);
            // Load allergen filters
            setSelectedTags((prev) => [
                ...prev,
                ...preferences.allergenFilters,
            ]);
            // Load ingredient filters
            setExcludedIngredients(preferences.ingredientFilters);
        }
    }, [preferences, loadingPreferences]);

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
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-4">
                        <div className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                            Showing menu for:{" "}
                            <span className="font-semibold capitalize">
                                {currentMealPeriod}
                            </span>
                        </div>
                        <SavePreferencesButton
                            dietaryPreferences={selectedTags.filter((tag) =>
                                PREFERENCE_TAGS.has(tag)
                            )}
                            excludedAllergens={selectedTags.filter((tag) =>
                                ALLERGEN_TAGS.has(tag)
                            )}
                            excludedIngredients={excludedIngredients}
                        />
                    </div>
                </div>

                <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-ucla-blue/10 dark:bg-ucla-blue/20 p-1">
                        {diningHalls.map((hall) => (
                            <Tab
                                key={hall.code}
                                className={({ selected }) =>
                                    classNames(
                                        "w-full rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-medium leading-5",
                                        "ring-white/60 ring-offset-2 ring-offset-ucla-blue focus:outline-none focus:ring-2",
                                        selected
                                            ? "bg-white dark:bg-gray-800 text-ucla-blue shadow"
                                            : "text-ucla-blue hover:bg-white/[0.12] hover:text-ucla-blue dark:text-gray-300 dark:hover:bg-gray-800/50"
                                    )
                                }
                                onClick={() => setSelectedDiningHall(hall.code)}
                            >
                                {hall.name}
                            </Tab>
                        ))}
                    </Tab.List>
                </Tab.Group>

                <div className="mt-6 sm:mt-8">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            Dietary Preferences
                        </h2>
                        {selectedTags.some((tag) =>
                            PREFERENCE_TAGS.has(tag)
                        ) && (
                            <button
                                onClick={clearPreferenceTags}
                                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear preferences
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {preferenceTags.map((tag) => (
                            <button
                                key={tag.code}
                                onClick={() => toggleTag(tag.code)}
                                className={classNames(
                                    "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors",
                                    selectedTags.includes(tag.code)
                                        ? "bg-ucla-blue text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                )}
                                title={tag.description}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            Exclude Allergens
                        </h2>
                        {selectedTags.some((tag) => ALLERGEN_TAGS.has(tag)) && (
                            <button
                                onClick={clearAllergenTags}
                                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear allergens
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {allergenTags.map((tag) => (
                            <button
                                key={tag.code}
                                onClick={() => toggleTag(tag.code)}
                                className={classNames(
                                    "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors",
                                    selectedTags.includes(tag.code)
                                        ? "bg-red-600 text-white"
                                        : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                )}
                                title={`Exclude dishes that ${tag.description.toLowerCase()}`}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 sm:mt-8">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            Exclude Ingredients
                        </h2>
                        {excludedIngredients.length > 0 && (
                            <button
                                onClick={() => setExcludedIngredients([])}
                                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear ingredients
                            </button>
                        )}
                    </div>

                    {excludedIngredients.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5 sm:gap-2">
                            {excludedIngredients.map((ingredient) => (
                                <button
                                    key={ingredient}
                                    onClick={() => removeIngredient(ingredient)}
                                    className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                >
                                    {ingredient}
                                    <svg
                                        className="ml-1 h-3 w-3"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}

                    <Combobox
                        value={ingredientQuery}
                        onChange={(value) => {
                            if (value && !excludedIngredients.includes(value)) {
                                setExcludedIngredients([
                                    ...excludedIngredients,
                                    value,
                                ]);
                            }
                            setIngredientQuery("");
                        }}
                    >
                        <div className="relative w-full">
                            <div className="relative">
                                <Combobox.Input
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ucla-blue focus:border-transparent"
                                    placeholder="Search ingredients to exclude..."
                                    onChange={(event) =>
                                        setIngredientQuery(event.target.value)
                                    }
                                    displayValue={(ingredient: string) =>
                                        ingredient
                                    }
                                />
                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </Combobox.Button>
                            </div>

                            <Combobox.Options className="absolute z-50 mt-1 w-full max-h-[300px] overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {filteredIngredients
                                    .filter(
                                        (ingredient) =>
                                            !excludedIngredients.includes(
                                                ingredient
                                            )
                                    )
                                    .slice(0, 50).length === 0 ? (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                        No ingredients found.
                                    </div>
                                ) : (
                                    filteredIngredients
                                        .filter(
                                            (ingredient) =>
                                                !excludedIngredients.includes(
                                                    ingredient
                                                )
                                        )
                                        .slice(0, 50)
                                        .map((ingredient) => (
                                            <Combobox.Option
                                                key={ingredient}
                                                value={ingredient}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active
                                                            ? "bg-ucla-blue text-white"
                                                            : "text-gray-900 dark:text-white"
                                                    }`
                                                }
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected
                                                                    ? "font-medium"
                                                                    : "font-normal"
                                                            }`}
                                                        >
                                                            {ingredient}
                                                        </span>
                                                        {selected ? (
                                                            <span
                                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                    active
                                                                        ? "text-white"
                                                                        : "text-ucla-blue"
                                                                }`}
                                                            >
                                                                <svg
                                                                    className="h-5 w-5"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))
                                )}
                            </Combobox.Options>
                        </div>
                    </Combobox>
                </div>

                <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                    {(selectedTags.length > 0 ||
                        excludedIngredients.length > 0) && (
                        <div className="flex justify-end">
                            <button
                                onClick={clearAllFilters}
                                className="text-xs sm:text-sm text-ucla-blue hover:text-ucla-blue/80 dark:text-ucla-blue/80 dark:hover:text-ucla-blue/60 font-medium"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-ucla-blue"></div>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                Loading dishes...
                            </p>
                        </div>
                    ) : dishes.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                No dishes found with the selected filters
                            </p>
                        </div>
                    ) : (
                        dishes.map((dish) => (
                            <div
                                key={dish.id}
                                className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
                            >
                                {user && (
                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                                        <FavoriteButton
                                            dishId={dish.id}
                                            initialIsFavorite={dish.isFavorite}
                                        />
                                    </div>
                                )}
                                <div className="pr-8 sm:pr-10">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                                            {dish.name}
                                        </h3>
                                        {dish.rating && (
                                            <RatingStars
                                                dishId={dish.id}
                                                averageRating={
                                                    dish.rating.average
                                                }
                                                ratingCount={dish.rating.count}
                                                userRating={
                                                    dish.rating.userRating
                                                }
                                            />
                                        )}
                                    </div>
                                    {dish.dietary_tags && (
                                        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5">
                                            {dish.dietary_tags.map(
                                                (tagCode) => {
                                                    const tag =
                                                        dietaryTags.find(
                                                            (t) =>
                                                                t.code ===
                                                                tagCode
                                                        );
                                                    if (!tag) return null;
                                                    return (
                                                        <span
                                                            key={tagCode}
                                                            className={classNames(
                                                                "px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium",
                                                                tag.isPreference
                                                                    ? "bg-ucla-blue/10 text-ucla-blue dark:bg-ucla-blue/20 dark:text-ucla-blue/80"
                                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                            )}
                                                            title={
                                                                tag.description
                                                            }
                                                        >
                                                            {tag.name}
                                                        </span>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                    {dish.ingredients && (
                                        <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            {dish.ingredients.join(", ")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
