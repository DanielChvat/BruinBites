"use client";

import LoginButton from "./LoginButton";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav className="bg-ucla-blue shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0">
                        <h1 className="text-2xl font-bold text-white">
                            BruinBites
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {user && (
                            <span className="text-white text-sm">
                                Welcome,{" "}
                                {user.user_metadata?.full_name ||
                                    user.email?.split("@")[0]}
                            </span>
                        )}
                        <LoginButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
