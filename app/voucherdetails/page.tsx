"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { Navbar } from "@/components/ui/navbar"; // Import Navbar
import { getUser, fetchVouchers, addToCart } from "./action";

export default function VoucherDetailsPage() {
  const [user, setUser] = useState<{ id: string; email?: string; totalpoints?: number } | null>(null);
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = supabaseBrowser();

  // Fetch user
    useEffect(() => {
      const loadUser = async () => {
        const userData = await getUser();
        setUser(userData);
        setLoading(false);
        if (!userData) router.push("/auth");
      };
      loadUser();
    }, [router]);

    // Fetch vouchers
      useEffect(() => {
        const loadVouchers = async () => {
          const data = await fetchVouchers();
          setVoucher(data);
        };
        loadVouchers();
      }, []);

      
  // Get voucher ID from query (?id=)
  const voucherId = searchParams.get("id");

  useEffect(() => {
    if (!voucherId) return;

    const fetchVoucher = async () => {
      const { data, error } = await supabase
        .from("voucher")
        .select("*")
        .eq("id", voucherId)
        .single();

      if (error) {
        console.error("Error fetching voucher:", error);
      } else {
        setVoucher(data);
      }
      setLoading(false);
    };

    fetchVoucher();
  }, [voucherId, supabase]);

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="h-svh flex items-center justify-center">
        <p className="text-gray-600">Voucher not found</p>
      </div>
    );
  }

  // Map category_id to names
  const categoryMap: Record<number, string> = {
    1: "Sport",
    2: "Food",
    3: "Entertainment",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar user={user ?? undefined} />

      {/* Page content */}
      <div className="flex-1 p-6">
        {/* Back Button */}
        <button
          className="self-start text-[#512da8] mb-4"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        {/* Voucher Card */}
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 mx-auto">
          {/* Image */}
          <img
            src={`/images/${voucher.image || "default.jpg"}`}
            alt={voucher.title}
            className="w-full h-64 object-cover rounded-md mb-4"
          />

          {/* Title + Category */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">{voucher.title}</h1>
            <span className="text-sm font-medium text-[#512da8]">
              {categoryMap[voucher.category_id] || "Other"}
            </span>
          </div>

          {/* Points */}
          <div className="flex items-center space-x-2 text-gray-700 mb-4">
            <GiTwoCoins className="text-yellow-500" />
            <p>Redeem for {voucher.points} points</p>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4">{voucher.description}</p>

          {/* Terms & Conditions */}
          <div className="mt-4 border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Terms & Conditions
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {voucher.terms || "No specific terms available."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <Button
              className="bg-[#512da8] text-white px-6 py-2 rounded-md"
              onClick={() => alert(`Redeemed: ${voucher.title}`)}
            >
              Redeem
            </Button>

            <div className="flex space-x-4 text-gray-600 text-xl">
              <FaHeart
                className="cursor-pointer hover:text-red-500"
                onClick={() => alert(`Added ${voucher.title} to wishlist`)}
              />
              <FaShoppingCart
            className="cursor-pointer hover:text-[#512da8]"
            onClick={async () => {
              if (!user) return router.push("/auth");

              try {
                // Call the action to add to cart
                const result = await addToCart(user.id, voucher.id);

                if (result.success) {
                  alert(`${voucher.title} added to cart`);
                } else {
                  alert(`Failed to add ${voucher.title} to cart`);
                }
              } catch (error) {
                console.error("Error adding to cart:", error);
                alert("Something went wrong while adding to cart");
              }
            }}
          />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
