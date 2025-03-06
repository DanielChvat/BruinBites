-- Create dish_ratings table
CREATE TABLE IF NOT EXISTS dish_ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, dish_id)
);

-- Add RLS policies
ALTER TABLE dish_ratings ENABLE ROW LEVEL SECURITY;

-- Allow users to view all ratings
CREATE POLICY "Anyone can view ratings"
    ON dish_ratings
    FOR SELECT
    USING (true);

-- Allow users to insert their own ratings
CREATE POLICY "Users can insert their own ratings"
    ON dish_ratings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ratings
CREATE POLICY "Users can update their own ratings"
    ON dish_ratings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own ratings
CREATE POLICY "Users can delete their own ratings"
    ON dish_ratings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS dish_ratings_user_id_idx ON dish_ratings(user_id);
CREATE INDEX IF NOT EXISTS dish_ratings_dish_id_idx ON dish_ratings(dish_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rating_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_dish_ratings_updated_at
    BEFORE UPDATE ON dish_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_rating_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON dish_ratings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE dish_ratings_id_seq TO authenticated; 