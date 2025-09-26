"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { signOutUser } from "@/app/home/action";

// Suggest passing a richer user; we use presence of user to detect auth
export function Navbar({
  user,
}: {
  user?: { id?: string; totalpoints?: number };
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [profileOpen]);

  const isAuthed = !!user?.id; // treat presence of id as logged-in

  return (
    <nav className="w-full bg-[#512da8] shadow-md px-6 py-4 flex items-center justify-between">
      {/* Left - Logo */}
      <div
        className="text-2xl font-bold text-white cursor-pointer"
        onClick={() => router.push("/")}
      >
        Optima Bank
      </div>

      {/* Center - Navigation Links */}
      <div className="flex space-x-6 font-medium text-white">
        <button
          onClick={() => router.push("/home")}
          className={`${
            isActive("/home") ? "text-yellow-300 font-bold" : "text-white"
          } hover:text-yellow-300`}
        >
          Home
        </button>
        {/* Removed Rewards and Voucher tabs per request */}
        <button
          onClick={() => router.push("/wishlist")}
          className={`flex items-center space-x-1 ${
            isActive("/wishlist") ? "text-yellow-300 font-bold" : "text-white"
          } hover:text-yellow-300`}
        >
          Wishlist
        </button>
        <button
          onClick={() => router.push("/cart")}
          className={`${
            isActive("/cart") ? "text-yellow-300 font-bold" : "text-white"
          } hover:text-yellow-300`}
        >
          Cart
        </button>
      </div>

      {/* Right - Coins + Profile */}
      <div className="flex items-center space-x-6 relative" ref={menuRef}>
        {/* Coins */}
        <div className="flex items-center space-x-1 text-white">
          <GiTwoCoins className="text-yellow-500 text-xl" />
          <span className="font-semibold">{user?.totalpoints ?? 0}</span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <FaUserCircle
            className="text-3xl text-white cursor-pointer"
            onClick={() => setProfileOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
          />
          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 overflow-hidden"
            >
              {isAuthed ? (
                <>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      router.push("/profile"); // go to profile when signed in
                      setProfileOpen(false);
                    }}
                    role="menuitem"
                  >
                    User Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      router.push("/voucherhistory"); // go to voucher history
                      setProfileOpen(false);
                    }}
                    role="menuitem"
                  >
                    Voucher History
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={async () => {
                      await signOutUser();
                      router.push("/auth"); // send to sign-in after logout
                      setProfileOpen(false);
                    }}
                    role="menuitem"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    router.push("/auth"); // show sign-in if not logged in
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
    </nav>
  );
}
