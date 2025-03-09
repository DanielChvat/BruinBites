"use client";

import LoginButton from "./LoginButton";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav className="bg-ucla-blue shadow-lg">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center py-2 sm:py-0">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-white">
                                BruinBites
                            </h1>
                        </div>
                        <div className="sm:hidden">
                            <LoginButton />
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end flex-1 pb-2 sm:pb-0">
                        {user && (
                            <span className="text-white text-sm truncate max-w-[200px]">
                                Welcome,{" "}
                                {user.user_metadata?.full_name ||
                                    user.email?.split("@")[0]}
                            </span>
                        )}
                        <div className="hidden sm:block">
                            <LoginButton />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
