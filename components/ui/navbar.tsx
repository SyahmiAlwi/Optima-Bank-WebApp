"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { signOutUser } from "@/app/home/action";

// Suggest passing a richer user; we use presence of user to detect auth
export function Navbar({
  user,
}: {
  user?: { id?: string; totalpoints?: number };
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  // Close dropdown on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        profileOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [profileOpen, mobileMenuOpen]);

  const isAuthed = !!user?.id; // treat presence of id as logged-in

  return (
    <nav className="w-full bg-[#512da8] shadow-md px-4 sm:px-6 py-4 flex items-center justify-between relative">
      {/* Left - Logo */}
      <div
        className="text-xl sm:text-2xl font-bold text-white cursor-pointer"
        onClick={() => router.push("/")}
      >
        Optima Bank
      </div>

      {/* Desktop Navigation Links - Hidden on mobile */}
      <div className="hidden md:flex space-x-6 font-medium text-white">
        <button
          onClick={() => router.push("/home")}
          className={`${
            isActive("/home") ? "text-yellow-300 font-bold" : "text-white"
          } hover:text-yellow-300 transition-colors`}
        >
          Home
        </button>
        <button
          onClick={() => router.push("/wishlist")}
          className={`flex items-center space-x-1 ${
            isActive("/wishlist") ? "text-yellow-300 font-bold" : "text-white"
          } hover:text-yellow-300 transition-colors`}
        >
          Wishlist
        </button>
        <button
          onClick={() => router.push("/cart")}
          className={`${
            isActive("/cart") ? "text-yellow-300 font-bold" : "text-white"
          } hover:text-yellow-300 transition-colors`}
        >
          Cart
        </button>
      </div>

      {/* Right - Coins + Profile + Mobile Menu Button */}
      <div className="flex items-center space-x-3 sm:space-x-6 relative">
        {/* Coins */}
        <div className="flex items-center space-x-1 text-white">
          <GiTwoCoins className="text-yellow-500 text-lg sm:text-xl" />
          <span className="font-semibold text-sm sm:text-base">
            {user?.totalpoints ?? 0}
          </span>
        </div>

        {/* Mobile Menu Button - Only visible on small screens */}
        <button
          className="md:hidden text-white text-xl"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Profile Dropdown - Hidden on mobile when menu is closed */}
        <div
          className={`relative ${mobileMenuOpen ? "hidden md:block" : ""}`}
          ref={menuRef}
        >
          <FaUserCircle
            className="text-2xl sm:text-3xl text-white cursor-pointer"
            onClick={() => setProfileOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
          />
          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-20 overflow-hidden"
            >
              {isAuthed ? (
                <>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      router.push("/profile");
                      setProfileOpen(false);
                    }}
                    role="menuitem"
                  >
                    User Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      router.push("/voucherhistory");
                      setProfileOpen(false);
                    }}
                    role="menuitem"
                  >
                    Voucher History
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={async () => {
                      await signOutUser();
                      router.push("/auth");
                      setProfileOpen(false);
                    }}
                    role="menuitem"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    router.push("/auth");
                    setProfileOpen(false);
                  }}
                  role="menuitem"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 right-0 bg-[#512da8] shadow-lg md:hidden z-10 border-t border-purple-400"
        >
          <div className="flex flex-col space-y-1 p-4">
            <button
              onClick={() => {
                router.push("/home");
                setMobileMenuOpen(false);
              }}
              className={`text-left py-3 px-2 rounded transition-colors ${
                isActive("/home")
                  ? "text-yellow-300 font-bold bg-purple-600"
                  : "text-white hover:bg-purple-600"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                router.push("/wishlist");
                setMobileMenuOpen(false);
              }}
              className={`text-left py-3 px-2 rounded transition-colors ${
                isActive("/wishlist")
                  ? "text-yellow-300 font-bold bg-purple-600"
                  : "text-white hover:bg-purple-600"
              }`}
            >
              Wishlist
            </button>
            <button
              onClick={() => {
                router.push("/cart");
                setMobileMenuOpen(false);
              }}
              className={`text-left py-3 px-2 rounded transition-colors ${
                isActive("/cart")
                  ? "text-yellow-300 font-bold bg-purple-600"
                  : "text-white hover:bg-purple-600"
              }`}
            >
              Cart
            </button>

            {/* Mobile Profile Section */}
            <div className="border-t border-purple-400 pt-3 mt-3">
              {isAuthed ? (
                <>
                  <button
                    className="w-full text-left py-3 px-2 text-white hover:bg-purple-600 rounded transition-colors"
                    onClick={() => {
                      router.push("/profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    User Profile
                  </button>
                  <button
                    className="w-full text-left py-3 px-2 text-white hover:bg-purple-600 rounded transition-colors"
                    onClick={() => {
                      router.push("/voucherhistory");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Voucher History
                  </button>
                  <button
                    className="w-full text-left py-3 px-2 text-white hover:bg-purple-600 rounded transition-colors"
                    onClick={async () => {
                      await signOutUser();
                      router.push("/auth");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left py-3 px-2 text-white hover:bg-purple-600 rounded transition-colors"
                  onClick={() => {
                    router.push("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
