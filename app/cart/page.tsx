"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  FaUserCircle,
  FaShoppingCart,
  FaBasketballBall,
  FaUtensils,
  FaFilm,
} from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { getUser, signOutUser } from "./action";

export default function CartPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  // Fetch user and cart
 useEffect(() => {
  const loadUserAndCart = async () => {
    const userData = await getUser();
    if (!userData) {
      router.push("/auth");
      return;
    }
    setUser(userData);

    // Fetch cart items for this user
    const { data, error } = await supabaseBrowser()
      .from("cart")
      .select("id, quantity, voucher(*)")
      .eq("user_id", userData.id);

    if (error) console.error("Error fetching cart:", error);
    else setCartItems(data || []);

    setLoading(false);
  };

  loadUserAndCart();
}, [router]); // only include stable dependencies


  // Pure front-end logic to update quantity
  const updateQuantity = (cartId: number, change: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const newQty = item.quantity + change;
            if (newQty < 1) return null; // remove if quantity < 1
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Pure front-end logic to remove item
  const removeItem = (cartId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartId));
  };

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center bg-gradient-to-r from-gray-200 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
        <aside className="w-40 bg-white shadow-md flex flex-col py-6">
        <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">Categories</h2>
       <nav className="flex flex-col space-y-4">
  {["All", "Sport", "Food", "Entertainment"].map((cat) => (
    <button
      key={cat}
      onClick={() => router.push(`/home?category=${cat}`)} // <-- point to homepage
      className={`flex items-center px-4 py-2 rounded-r-full ${
        activeCategory === cat
          ? "bg-[#512da8] text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`}
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-md relative">
          <div className="text-2xl font-bold text-[#512da8]">Optima Bank</div>
          <div className="flex-1 px-6">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#512da8]"
            />
          </div>

          <div className="flex items-center space-x-6 relative">
            <div className="flex items-center space-x-1 text-gray-700">
              <GiTwoCoins className="text-yellow-500 text-xl" />
              <span className="font-semibold">1200</span>
            </div>

            <FaShoppingCart
              className="text-2xl text-gray-700 cursor-pointer hover:text-[#512da8]"
              onClick={() => router.push("/cart")}
            />

            <div className="relative">
              <FaUserCircle
                className="text-3xl text-gray-700 cursor-pointer"
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
        </header>

       {/* Cart Content */}
<main className="p-6 flex gap-6">
  {/* Left: Cart items */}
  <div className="flex-1">
    {/* ✅ Title outside of the card */}
    <h2 className="text-xl font-semibold mb-4">Your Cart</h2>

    <div className="bg-white p-4 rounded-lg shadow">
      {cartItems.length === 0 && <p>Your cart is empty</p>}

      {/* Remove voucher */}
      {cartItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-gray-50 p-4 mb-4 rounded-lg"
        >
          {/* Left: Remove button + Voucher image */}
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
            <p className="text-gray-600 text-sm">
              Redeem for {item.voucher.points} points
            </p>
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
    <Button className="mt-4 w-full bg-[#512da8] text-white">Checkout</Button>
  </div>
</main>

      </div>
    </div>
  );
}
