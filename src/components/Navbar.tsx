"use client";

import LoginButton from "./LoginButton";

export default function Navbar() {
    return (
        <nav className="bg-ucla-blue shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0">
                        <h1 className="text-2xl font-bold text-white">
                            BruinBites
                        </h1>
                    </div>
                    <div className="flex items-center">
                        <LoginButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
