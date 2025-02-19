# BruinBites

A mobile-friendly web application for UCLA students to explore dining hall menus and filter dishes based on dietary preferences.

## Features

-   View dishes from Epicuria, De Neve, and Bruin Plate dining halls
-   Filter dishes by dietary preferences (vegetarian, vegan, halal, etc.)
-   View detailed ingredient lists for each dish
-   Mobile-friendly interface
-   Real-time menu updates

## Tech Stack

-   Next.js 14 with App Router
-   TypeScript
-   Tailwind CSS
-   Supabase (PostgreSQL + Auth)
-   OpenAI API (for ingredient parsing)

## Prerequisites

-   Node.js 18.17 or later
-   npm or yarn
-   Supabase account
-   OpenAI API key

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/bruinbites.git
    cd bruinbites
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Copy the environment variables template:

    ```bash
    cp .env.example .env.local
    ```

4. Fill in your environment variables in `.env.local`:

    - Get your Supabase URL and anon key from your Supabase project settings
    - Add your OpenAI API key

5. Set up the database:
    - Create a new Supabase project
    - Run the SQL commands in `supabase/schema.sql` in the Supabase SQL editor
    - Run the database population script:
        ```bash
        npm run populate-db
        ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The app can be deployed to Vercel:

1. Push your code to GitHub
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Add your environment variables in Vercel
5. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
