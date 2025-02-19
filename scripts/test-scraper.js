const { parseIngredients } = require("./scraper");

const testCases = [
    "Pomodoro Sauce (Tomatoes (Fresh), Garlic (Minced), Herbs)",
    "Cannellini Beans (White Kidney Beans, Water)",
    "Tomato (Vine-Ripened Tomatoes, Contains 2% or Less: Salt, Calcium Chloride)",
    "Pasta (Wheat Flour (Enriched with Vitamins and Minerals))",
    "Mixed Vegetables (Contains: Carrots, Peas (Green), Corn)",
    "Marinara Sauce (Tomato Puree (Water, Tomato Paste), Diced Tomatoes)",
    "Black Beans (Prepared Black Beans, Water, Salt, Calcium Chloride)",
    "Cheese Blend (Mozzarella, Provolone (Cultured Milk, Salt, Enzymes))",

    "Water, Penne Pasta (Semolina Wheat, Durum Wheat Flour, Vitamin B3 Niacin, Iron Ferrous Sulfate, Vitamin B1 Thiamine Mononitrate, Vitamin B2 Riboflavin, Folic Acid), Canola Oil (Canola Oil), Kosher Salt",

    "Bechamel Sauce (Low-Fat Milk, Milk, White Sauce Mix), Sundried Tomatoes (Tomatoes, Salt, Glucose, Citric Acid, Sulfur Dioxide.), Shallots, Canola Oil (Canola Oil), Kosher Salt, Peppercorn",

    "Halal Chicken, Fresh Lemon Juice, Extra Virgin Olive Oil (Extra Virgin Olive Oil), Garlic (Garlic), Cilantro, Kosher Salt, Oregano (Oregano), Smoked Paprika (Paprika, Silicone Dioxide (Added To Make Free-flowing)), Lemon Zest (Chopped Lemon Peels, Cane Sugar, Natural Lemon Flavor), Honey, Black Pepper, Dried Cayenne Pepper, Cumin",
];

console.log("Testing ingredient parsing:\n");

testCases.forEach((test) => {
    console.log("Input:", test);
    console.log("Output:", parseIngredients(test));
    console.log("---\n");
});
