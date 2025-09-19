"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/navbar";
import { FaBasketballBall, FaUtensils, FaFilm } from "react-icons/fa";
import { getUser } from "./action";

export default function CartPage() {
  // ✅ Single user state with totalpoints
  const [user, setUser] = useState<{ id: string; email?: string; totalpoints?: number } | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Fetch user and cart
  useEffect(() => {
    const loadUserAndCart = async () => {
      const userData = await getUser(); // getUser must return totalpoints
      if (!userData) {
        router.push("/auth");
        return;
      }
      setUser(userData);

      const { data, error } = await supabaseBrowser()
        .from("cart")
        .select("id, quantity, voucher(*)")
        .eq("user_id", userData.id);

      if (error) console.error("Error fetching cart:", error);
      else setCartItems(data || []);

      setLoading(false);
    };

    loadUserAndCart();
  }, [router]);



  // // ✅ Update quantity (frontend only)
  // const updateQuantity = (cartId: number, change: number) => {
  //   setCartItems((prev) =>
  //     prev
  //       .map((item) => {
  //         if (item.id === cartId) {
  //           const newQty = item.quantity + change;
  //           if (newQty < 1) return null;
  //           return { ...item, quantity: newQty };
  //         }
  //         return item;
  //       })
  //       .filter(Boolean)
  //   );
  // };

  // // ✅ Remove item (frontend only)
  // const removeItem = (cartId: number) => {
  //   setCartItems((prev) => prev.filter((item) => item.id !== cartId));
  // };

  // if (loading) {
  //   return (
  //     <div className="h-svh flex items-center justify-center bg-gradient-to-r from-gray-200 to-indigo-100">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8] mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const updateQuantity = async (cartId: number, change: number) => {
  const item = cartItems.find((i) => i.id === cartId);
  if (!item) return;

  const newQty = item.quantity + change;
  if (newQty < 1) return removeItem(cartId); // delete if quantity < 1

  try {
    const { error } = await supabaseBrowser()
      .from("cart")
      .update({ quantity: newQty })
      .eq("id", cartId);

    if (error) {
      console.error("Error updating cart:", error);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === cartId ? { ...i, quantity: newQty } : i))
    );
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};


  const removeItem = async (cartId: number) => {
  try {
    const { error } = await supabaseBrowser()
      .from("cart")
      .delete()
      .eq("id", cartId);

    if (error) {
      console.error("Error removing from cart:", error);
      return;
    }

    // Update frontend state
    setCartItems((prev) => prev.filter((item) => item.id !== cartId));
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};


  if (!user) return null;

  // ✅ Sidebar category navigation (redirect to HomePage with category param)
  const goToCategory = (category: string) => {
    if (category === "All") router.push("/home");
    else router.push(`/home?category=${category}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar with totalpoints */}
      <Navbar user={user} />

      {/* Page Layout */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-40 h-full border-r border-gray-200 flex flex-col pt-6">
          <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">Categories</h2>
          <nav className="flex flex-col space-y-2">
            {["All", "Sport", "Food", "Entertainment"].map((cat) => (
              <button
                key={cat}
                onClick={() => goToCategory(cat)}
                className="flex items-center px-4 py-2 rounded-r-full transition text-gray-700 hover:bg-purple-50 hover:text-[#512da8]"
              >
                {cat === "Sport" && <FaBasketballBall className="mr-2" />}
                {cat === "Food" && <FaUtensils className="mr-2" />}
                {cat === "Entertainment" && <FaFilm className="mr-2" />}
                {cat === "All" ? "All Vouchers" : cat}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 flex gap-6">
          {/* Left: Cart items */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              {cartItems.length === 0 && <p>Your cart is empty</p>}

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 p-4 mb-4 rounded-lg"
                >
                  {/* Remove button + Voucher image */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="bg-[#E34234] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600"
                      title="Remove"
                    >
                      -
                    </button>
                    <img
                      src={`/images/${item.voucher.image || "default.jpg"}`}
                      alt={item.voucher.title}
                      className="w-24 h-24 rounded-md"
                    />
                  </div>

                  {/* Voucher info */}
                  <div className="flex-1 ml-4">
                    <h3 className="font-semibold">{item.voucher.title}</h3>
                    <p className="text-gray-500 text-sm">{item.voucher.description}</p>
                    <p className="text-[#512da8] text-sm">Redeem for {item.voucher.points} points</p>
                    <p className="text-gray-800 text-sm font-medium mt-1">
                      Total points: {item.quantity * item.voucher.points}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        className="bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </Button>
                      <span className="px-2">{item.quantity}</span>
                      <Button
                        className="bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="w-64 bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Summary</h3>
            <p>Quantity: {cartItems.reduce((acc, i) => acc + i.quantity, 0)}</p>
            <p className="mt-2">
              Total points to be redeemed:{" "}
              {cartItems.reduce((acc, i) => acc + i.quantity * i.voucher.points, 0)}
            </p>
            <p className="mt-2">
              Your total points: {user.totalpoints}
            </p>
            <Button className="mt-4 w-full bg-[#512da8] text-white">
              Checkout
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
