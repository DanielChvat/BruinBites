import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

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
            <body
                className={`${inter.className} min-h-full bg-gray-50 dark:bg-gray-900`}
            >
                <AuthProvider>
                    <Navbar />
                    <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
