const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const { JSDOM } = require("jsdom");

const DINING_HALLS = {
    EPICURIA: 0,
    DENEVE: 1,
    BRUINPLATE: 2,
};

const DIETARY_TAGS = [
    "V",
    "VG",
    "APNT",
    "ATNT",
    "AWHT",
    "AGTN",
    "ASOY",
    "ASES",
    "AMLK",
    "AEGG",
    "ACSF",
    "AFSH",
    "AALC",
    "HAL",
    "LC",
    "HC",
];

async function fetchDOM(url) {
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    return document;
}

async function getIngredientInfo(url) {
    let document = await fetchDOM(url);

    if (document.getElementsByClassName("redirect-info").length > 0)
        return ["", {}];

    let ingredients = document
        .getElementsByClassName("ingred_allergen")[0]
        .getElementsByTagName("p")[0].childNodes[1].textContent;

    let dish_dietary_tags = {};

    DIETARY_TAGS.forEach((tag) => {
        dish_dietary_tags[tag] = Boolean(
            document.querySelector(`img[alt="${tag}"]`)
        );
    });

    return [ingredients, dish_dietary_tags];
}

async function getDishInfo(url, DINING_HALL_ID) {
    let document = await fetchDOM(url);

    let elements = document.getElementsByClassName("recipelink");

    dishes = Array(elements.length);

    for (let i = 0; i < elements.length; i++) {
        const ingredient_info = await getIngredientInfo(elements[i].href);

        dishes[i] = {
            NAME: elements[i].textContent,
            RECIPE: elements[i].href,
            INGREDIENTS: ingredient_info[0],
            "DIETARY TAGS": ingredient_info[1],
            DINING_HALL_ID: DINING_HALL_ID,
        };
    }

    return dishes;
}

async function classifyIngredients(dish) {
    const completion = await openai.chat.completions
        .create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "developer",
                    content: `
                Extract ingredients from the provided text input and return them as a list in a JSON object.

Identify and isolate the section that lists ingredients within the provided text. Extract each component ingredient as a 
separate string, even if they are nested within other ingredients. Ensure that the output only includes ingredients and 
not dish names, descriptors, or any other information.

# Output Format
Return the output as a JSON object with the following schema:

json

{

  "ingredients": [

    "ingredient 1",

    "ingredient 2",

    "ingredient 3"

  ]

}


# Examples

**Example Input:**

plaintext

Name: Herbs de Provence Grilled Chicken Thigh

Descriptors: HAL Halal Menu Option

INGREDIENTS: Halal Chicken, Herbes de Provence Marinade (Fresh Lemon Juice, Garlic Powder, Herbs De Provence (Spices, Lavender), 
Extra Virgin Olive Oil (Extra Virgin Olive Oil), Black Pepper, Kosher Salt)

**Expected Output:**

json

{

  "ingredients": [

    "Halal Chicken",

    "Herbes de Provence Marinade",

    "Fresh Lemon Juice",

    "Garlic Powder",

    "Herbes De Provence",

    "Spices",

    "Lavender",

    "Extra Virgin Olive Oil",

    "Black Pepper",

    "Kosher Salt"

  ]

}
                `,
                },
                {
                    role: "user",
                    content: dish,
                },
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "dish_schema",

                    strict: true,

                    schema: {
                        type: "object",

                        required: ["dishes"],

                        properties: {
                            dishes: {
                                type: "array",

                                items: {
                                    type: "object",

                                    required: ["dish", "ingredients"],

                                    properties: {
                                        dish: {
                                            type: "string",

                                            description:
                                                "The name of the dish.",
                                        },

                                        ingredients: {
                                            type: "array",

                                            items: {
                                                type: "string",
                                            },

                                            description:
                                                "A list of ingredients required for the dish.",
                                        },
                                    },

                                    additionalProperties: false,
                                },

                                description:
                                    "A list of dishes, variable number based on input",
                            },
                        },

                        additionalProperties: false,
                    },
                },
            },
        })
        .then((response) => console.log(response.choices[0].message));
}

(async () => {
    await getDishInfo(
        "https://menu.dining.ucla.edu/Menus/Epicuria",
        DINING_HALLS.EPICURIA
    );
    await getDishInfo(
        "https://menu.dining.ucla.edu/Menus/DeNeve",
        DINING_HALLS.DENEVE
    );
    await getDishInfo(
        "https://menu.dining.ucla.edu/Menus/BruinPlate",
        DINING_HALLS.BRUINPLATE
    );
})();

module.exports = {
    getDishes: getDishInfo,
};
