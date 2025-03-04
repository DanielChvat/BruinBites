"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
    const { signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-3xl font-bold text-ucla-blue mb-4">
                Access Restricted
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl">
                BruinBites is exclusively for UCLA students and faculty. Please
                sign in with your UCLA email address to access the application.
            </p>
            <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Sign Out
            </button>
        </div>
    );
}
