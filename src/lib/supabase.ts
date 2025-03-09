import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type DiningHall = {
    id: number;
    name: string;
    code: string;
};

export interface Dish {
    id: number;
    name: string;
    dining_hall_id: number;
    recipe_url?: string;
    created_at: string;
    updated_at: string;
    dining_halls?: {
        code: string;
    };
    dietary_tags?: string[];
    ingredients?: string[];
    rating?: {
        average: number;
        count: number;
        userRating?: number;
    };
    isFavorite?: boolean;
}

export type Ingredient = {
    id: number;
    name: string;
};

export type DietaryTag = {
    id: number;
    code: string;
    name: string;
    description: string;
    isAllergen: boolean;
    isPreference: boolean;
};
