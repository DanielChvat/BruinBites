const { OpenAI } = require("openai");
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
    return dom.window.document;
}

async function getIngredientInfo(url) {
    let document = await fetchDOM(url);
    if (document.getElementsByClassName("redirect-info").length > 0)
        return ["", {}];
    let ingredients =
        document
            .getElementsByClassName("ingred_allergen")[0]
            ?.getElementsByTagName("p")[0]?.childNodes[1]?.textContent || "";
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
    let dishes = Array(elements.length);

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

module.exports = {
    getDishes: getDishInfo,
};
