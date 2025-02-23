"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function LoginButton() {
    const { user, signInWithGoogle, signOut } = useAuth();

    return (
        <button
            onClick={user ? signOut : signInWithGoogle}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            {user ? "Sign Out" : "Sign in with Google"}
        </button>
    );
}
