"use client";

import { motion } from "framer-motion";

export default function Nav() {
    return (
        <header className="relative z-20 flex items-center justify-center p-6">
            <nav className="flex items-center space-x-2">
                <a href="#features" className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Features</a>
                <a href="#pricing" className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Pricing</a>
                <a href="#security" className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Security</a>
            </nav>
        </header>
    );
}


