import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "BruinBites - UCLA Dining Hall Menu",
    description:
        "Find and filter dishes from UCLA dining halls based on your dietary preferences",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full">
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                // Check localStorage first
                                const darkMode = localStorage.getItem('darkMode');
                                if (darkMode !== null) {
                                    if (darkMode === 'true') {
                                        document.documentElement.classList.add('dark');
                                    }
                                    return;
                                }
                                
                                // If no localStorage value, check system preference
                                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                                    document.documentElement.classList.add('dark');
                                }
                            })();
                        `,
                    }}
                />
            </head>
            <body
                className={`${inter.className} min-h-full bg-gray-50 dark:bg-gray-900`}
            >
                <AuthProvider>
                    <div className="min-h-full flex flex-col">
                        <Navbar />
                        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
