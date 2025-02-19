/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    reactStrictMode: true,
    compiler: {
        // Suppress warnings about unknown HTML attributes
        // This is especially useful for browser extensions that add their own attributes
        reactRemoveProperties:
            process.env.NODE_ENV === "production"
                ? {
                      properties: [
                          "^data-new-gr-c-s-check-loaded$",
                          "^data-gr-ext-installed$",
                      ],
                  }
                : false,
    },
};

module.exports = nextConfig;
