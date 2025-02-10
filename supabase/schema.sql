-- Create dining_halls table
CREATE TABLE dining_halls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
);

-- Create dishes table
CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dining_hall_id INTEGER REFERENCES dining_halls(id),
    recipe_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create ingredients table
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Create dish_ingredients junction table
CREATE TABLE dish_ingredients (
    dish_id INTEGER REFERENCES dishes(id),
    ingredient_id INTEGER REFERENCES ingredients(id),
    PRIMARY KEY (dish_id, ingredient_id)
);

-- Create dietary_tags table
CREATE TABLE dietary_tags (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Create dish_dietary_tags junction table
CREATE TABLE dish_dietary_tags (
    dish_id INTEGER REFERENCES dishes(id),
    tag_id INTEGER REFERENCES dietary_tags(id),
    PRIMARY KEY (dish_id, tag_id)
);

-- Insert dining halls
INSERT INTO dining_halls (name, code) VALUES
    ('Epicuria at Covel', 'EPICURIA'),
    ('De Neve', 'DENEVE'),
    ('Bruin Plate', 'BRUINPLATE');

-- Insert dietary tags
INSERT INTO dietary_tags (code, name, description) VALUES
    ('V', 'Vegetarian', 'Contains no meat, fish, or poultry'),
    ('VG', 'Vegan', 'Contains no animal products'),
    ('APNT', 'Contains Peanuts', 'Contains peanuts or peanut derivatives'),
    ('ATNT', 'Contains Tree Nuts', 'Contains tree nuts'),
    ('AWHT', 'Contains Wheat', 'Contains wheat'),
    ('AGTN', 'Contains Gluten', 'Contains gluten'),
    ('ASOY', 'Contains Soy', 'Contains soy or soy derivatives'),
    ('ASES', 'Contains Sesame', 'Contains sesame seeds or oil'),
    ('AMLK', 'Contains Milk', 'Contains dairy products'),
    ('AEGG', 'Contains Eggs', 'Contains eggs'),
    ('ACSF', 'Contains Shellfish', 'Contains shellfish'),
    ('AFSH', 'Contains Fish', 'Contains fish'),
    ('AALC', 'Contains Alcohol', 'Contains alcohol'),
    ('HAL', 'Halal', 'Prepared according to Islamic dietary laws'),
    ('LC', 'Low Carbon', 'Low environmental impact'),
    ('HC', 'High Carbon', 'High environmental impact');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for dishes table
CREATE TRIGGER update_dishes_updated_at
    BEFORE UPDATE ON dishes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 