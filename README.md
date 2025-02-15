# BruinBites

A web application for UCLA students to explore dining hall menus, filter by dietary preferences, and discover ingredients in their meals.

## Features

-   View menus from Epicuria, De Neve, and Bruin Plate dining halls
-   Filter dishes by dietary preferences (vegetarian, vegan, halal, etc.)
-   Exclude specific ingredients
-   View detailed ingredient lists for each dish
-   Access recipe links when available

## Tech Stack

-   Next.js 14
-   Supabase (Database)
-   Tailwind CSS
-   TypeScript

## Deployment on Vercel

1. Fork or clone this repository
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Set up environment variables in Vercel:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
    - `CRON_SECRET`: A secure random string for the refresh endpoint

## Data Refresh

The application includes an API endpoint to refresh dining hall data. You can set up automatic updates using Vercel Cron Jobs:

1. Create a new Vercel Cron Job to hit the `/api/refresh` endpoint
2. Set the schedule (e.g., daily at midnight PT)
3. Include the authorization header: `Authorization: Bearer your-cron-secret`

Example cURL command for manual refresh:

```bash
curl -X POST https://your-app.vercel.app/api/refresh \
  -H "Authorization: Bearer your-cron-secret"
```

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the values
3. Install dependencies:
    ```bash
    npm install
    ```
4. Run the development server:
    ```bash
    npm run dev
    ```

## Security Considerations

-   The application uses Supabase's Row Level Security (RLS) policies
-   All database operations are performed through the secure Supabase client
-   The data refresh endpoint is protected by a secret key
-   Environment variables are properly configured for both development and production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
