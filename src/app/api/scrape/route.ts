import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

interface Dish {
    NAME: string;
    RECIPE: string;
    INGREDIENTS: string;
    "DIETARY TAGS": Record<string, boolean>;
    DINING_HALL_ID: number;
}

function parseIngredients(ingredientsText: string): string[] {
    return ingredientsText
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter(Boolean);
}

async function getDishes(url: string, diningHallId: number): Promise<Dish[]> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const root = parse(html);
        const dishes: Dish[] = [];

        root.querySelectorAll(".menu-item").forEach((element) => {
            const name =
                element.querySelector(".menu-item-name")?.text.trim() || "";
            const recipe =
                element
                    .querySelector(".menu-item-recipe a")
                    ?.getAttribute("href") || "";
            const ingredientsText =
                element.querySelector(".menu-item-ingredients")?.text.trim() ||
                "";
            const ingredients = parseIngredients(ingredientsText).join(",");
            const dietaryTags: Record<string, boolean> = {};

            element
                .querySelectorAll(".menu-item-dietary-tags span")
                .forEach((tag) => {
                    const tagCode = tag.classNames
                        .split(" ")
                        .find((c) => c.startsWith("tag-"))
                        ?.split("-")[1];
                    if (tagCode) {
                        dietaryTags[tagCode] = true;
                    }
                });

            dishes.push({
                NAME: name,
                RECIPE: recipe,
                INGREDIENTS: ingredients,
                "DIETARY TAGS": dietaryTags,
                DINING_HALL_ID: diningHallId,
            });
        });

        return dishes;
    } catch (error) {
        console.error(`Error fetching dishes from ${url}:`, error);
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");
        const diningHallId = parseInt(searchParams.get("diningHallId") || "0");

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        const dishes = await getDishes(url, diningHallId);
        return NextResponse.json(dishes);
    } catch (error) {
        console.error("Error in scrape endpoint:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
