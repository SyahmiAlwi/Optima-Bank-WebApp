"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { signOutUser } from "@/app/home/action";

// Accept "user" as a prop!
export function Navbar({ user }: { user?: { totalpoints?: number } }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/home";

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
          className={`${isHome ? "text-yellow-300 font-bold" : "text-white"} hover:text-yellow-300`}
        >
          Home
        </button>
        <button
          onClick={() => router.push("/rewards")}
          className="hover:text-yellow-300"
        >
          Rewards
        </button>
        <button
          onClick={() => router.push("/vouchers")}
          className="hover:text-yellow-300"
        >
          Voucher
        </button>
        <button
          onClick={() => router.push("/wishlist")}
          className="hover:text-yellow-300"
        >
          Wishlist
        </button>
        <button
          onClick={() => router.push("/cart")}
          className="hover:text-yellow-300"
        >
          Cart
        </button>
      </div>

      {/* Right - Coins + Profile */}
      <div className="flex items-center space-x-6 relative">
        {/* Coins */}
        <div className="flex items-center space-x-1 text-white">
          <GiTwoCoins className="text-yellow-500 text-xl" />
          <span className="font-semibold">
            {user?.totalpoints ?? 0}
          </span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <FaUserCircle
            className="text-3xl text-white cursor-pointer"
            onClick={() => setProfileOpen(!profileOpen)}
          />
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  router.push("/profile");
                  setProfileOpen(false);
                }}
              >
                User Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={async () => {
                  await signOutUser();
                  router.push("/auth");
                  setProfileOpen(false);
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}