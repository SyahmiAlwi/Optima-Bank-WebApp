"use client";

export default function Nav() {
    return (
        <header className="relative z-20 flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4">
            <nav className="flex items-center gap-2 sm:gap-3 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <a href="#features" className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Services</a>
                <a href="#security" className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Security</a>
                <a href="#testimonials" className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Testimonials</a>
            </nav>
        </header>
    );
}


