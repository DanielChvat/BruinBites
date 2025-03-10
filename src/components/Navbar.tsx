"use client";

import LoginButton from "./LoginButton";
import { useAuth } from "@/contexts/AuthContext";
import DarkModeToggle from "./DarkModeToggle";

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav className="bg-ucla-blue dark:bg-ucla-blue/90 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex-shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            BruinBites
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <span className="hidden sm:block text-white text-sm truncate max-w-[200px]">
                                Welcome,{" "}
                                {user.user_metadata?.full_name ||
                                    user.email?.split("@")[0]}
                            </span>
                        )}
                        <DarkModeToggle />
                        <LoginButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
