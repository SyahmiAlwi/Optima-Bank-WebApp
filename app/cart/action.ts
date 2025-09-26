"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import jsPDF from "jspdf";

// Fetch all vouchers
export const fetchVouchers = async () => {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.from("voucher").select("*");
  if (error) {
    console.error("Error fetching vouchers:", error);
    return [];
  }
  return data || [];
};

// Fix: Get authenticated user and their profile
export async function getUser() {
  const supabase = supabaseBrowser();

  // First, get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Error fetching authenticated user:", authError);
    return null;
  }

  // Then get their profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, totalpoints")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    return null;
  }

  return profile;
}

// Add function to remove item from cart with validation
export const removeFromCart = async (cartId: number) => {
  const supabase = supabaseBrowser();

  // First validate that the cart item exists
  const { data: existingItem, error: checkError } = await supabase
    .from("cart")
    .select("id, voucher_id")
    .eq("id", cartId)
    .single();

  if (checkError || !existingItem) {
    console.error("Error checking cart item:", checkError);
    return {
      success: false,
      message: "Cart item not found or already removed",
    };
  }

  // Proceed with deletion
  const { error } = await supabase.from("cart").delete().eq("id", cartId);

  if (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      message: "Failed to remove item from cart. Please try again.",
    };
  }

  return { success: true, message: "Item removed from cart" };
};

// Add function to remove all items from cart
export const removeAllFromCart = async (userId: string) => {
  const supabase = supabaseBrowser();

  // First check if user has any items in cart
  const { data: cartItems, error: checkError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId);

  if (checkError) {
    console.error("Error checking cart items:", checkError);
    return {
      success: false,
      message: "Failed to check cart items",
    };
  }

  if (!cartItems || cartItems.length === 0) {
    return {
      success: false,
      message: "Cart is already empty",
    };
  }

  // Remove all items for the user
  const { error } = await supabase.from("cart").delete().eq("user_id", userId);

  if (error) {
    console.error("Error removing all items from cart:", error);
    return {
      success: false,
      message: "Failed to clear cart. Please try again.",
    };
  }

  return {
    success: true,
    message: `Successfully removed ${cartItems.length} item(s) from cart`,
  };
};

// Add function to update cart item quantity
export const updateCartQuantity = async (
  cartId: number,
  newQuantity: number
) => {
  const supabase = supabaseBrowser();

  if (newQuantity < 1) {
    // If quantity is less than 1, remove the item
    return await removeFromCart(cartId);
  }

  // Validate that the cart item exists before updating
  const { data: existingItem, error: checkError } = await supabase
    .from("cart")
    .select("id, quantity")
    .eq("id", cartId)
    .single();

  if (checkError || !existingItem) {
    console.error("Error checking cart item:", checkError);
    return {
      success: false,
      message: "Cart item not found",
    };
  }

  const { error } = await supabase
    .from("cart")
    .update({ quantity: newQuantity })
    .eq("id", cartId);

  if (error) {
    console.error("Error updating cart quantity:", error);
    return {
      success: false,
      message: "Failed to update quantity. Please try again.",
    };
  }

  return { success: true, message: "Quantity updated" };
};

// Add function to handle redemptions (with fallback)
export const processRedemption = async (
  userId: string,
  voucherId: number,
  pointsUsed: number,
  quantity: number = 1
) => {
  const supabase = supabaseBrowser();

  // Try to insert into redemptions table
  const { error: redemptionError } = await supabase.from("redemptions").insert({
    user_id: userId,
    voucher_id: voucherId,
    points_used: pointsUsed,
    quantity: quantity,
    redeemed_at: new Date().toISOString(),
  });

  if (redemptionError) {
    console.error("Error recording redemption:", redemptionError);

    // If redemptions table doesn't exist, try alternative approach
    if (redemptionError.code === "42P01") {
      // Table doesn't exist
      console.log(
        "Redemptions table doesn't exist, using alternative tracking"
      );

      // You could store redemptions in user_vouchers table or another table
      // For now, we'll just log it and continue
      console.log(
        `Redemption processed: User ${userId} redeemed voucher ${voucherId} for ${pointsUsed} points`
      );
      return { success: true, message: "Redemption processed (logged)" };
    }

    return {
      success: false,
      message: "Error recording redemption",
      error: redemptionError,
    };
  }

  return { success: true, message: "Redemption recorded successfully" };
};

// Sign out user
export const signOutUser = async () => {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
};

// Add function to generate and download voucher PDF
export const generateVoucherPDF = async (
  voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
    image?: string;
  },
  userEmail: string
) => {
  const doc = new jsPDF();

  // Helper function to convert image to base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  try {
    // Set up the PDF styling first
    doc.setFontSize(22);
    doc.setTextColor(81, 45, 168);
    doc.text("Optima Bank - Voucher", 105, 25, { align: "center" });

    // Add voucher image if available
    if (voucher.image) {
      try {
        const imageData = await imageToBase64(voucher.image);
        // Add a subtle shadow effect
        doc.setFillColor(200, 200, 200);
        doc.rect(47, 37, 116, 62, "F");

        // Main image - slightly smaller to fit better
        doc.addImage(imageData, "JPEG", 45, 35, 120, 65);
      } catch (imageError) {
        console.warn("Could not load voucher image for PDF:", imageError);
      }
    }

    // Add voucher details with better spacing
    const contentStartY = voucher.image ? 110 : 45;

    doc.setFontSize(18);
    doc.setTextColor(81, 45, 168);
    doc.text(`${voucher.title}`, 105, contentStartY, { align: "center" });

    // Add separator line
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(1);
    doc.line(25, contentStartY + 5, 185, contentStartY + 5);

    // Voucher details with consistent spacing
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Description: ${voucher.description}`, 25, contentStartY + 18);
    doc.text(
      `Points Redeemed: ${voucher.points * voucher.quantity}`,
      25,
      contentStartY + 30
    );
    doc.text(`Quantity: ${voucher.quantity}`, 25, contentStartY + 42);
    doc.text(`Redeemed by: ${userEmail}`, 25, contentStartY + 54);
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      25,
      contentStartY + 66
    );

    // Voucher code section - smaller and better positioned
    const voucherCode = `OB-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Voucher code background - smaller height
    doc.setFillColor(81, 45, 168);
    doc.rect(25, contentStartY + 80, 160, 18, "F");

    // Voucher code text
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(`Voucher Code: ${voucherCode}`, 105, contentStartY + 92, {
      align: "center",
    });

    // Terms and conditions - better positioned and sized
    const termsStartY = contentStartY + 110;

    // Background box for terms & conditions - fits within borders
    doc.setFillColor(248, 249, 250);
    doc.rect(25, termsStartY, 160, 45, "F");

    // Border for terms section
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.rect(25, termsStartY, 160, 45);

    // Terms title
    doc.setFontSize(11);
    doc.setTextColor(81, 45, 168);
    doc.text("Terms & Conditions:", 30, termsStartY + 10);

    // Terms content with proper spacing
    const terms = [
      "This voucher is valid for 6 months from the date of issue",
      "This voucher cannot be exchanged for cash",
      "Present this voucher at participating merchants",
    ];

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    terms.forEach((term, index) => {
      const yPosition = termsStartY + 22 + index * 10;
      doc.text("•", 30, yPosition);
      doc.text(term, 35, yPosition);
    });

    // Main border
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(4);
    doc.rect(15, 15, 180, 257);

    // Download the PDF
    const fileName = `${voucher.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(fileName);

    return voucherCode;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Add function to download all redeemed vouchers as a single PDF
export const generateAllVouchersPDF = async (
  vouchers: Array<{
    title: string;
    description: string;
    points: number;
    quantity: number;
    image?: string;
  }>,
  userEmail: string
) => {
  const doc = new jsPDF();

  // Helper function to convert image to base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  for (let index = 0; index < vouchers.length; index++) {
    const voucher = vouchers[index];

    // Add new page for each voucher except the first one
    if (index > 0) {
      doc.addPage();
    }

    try {
      // Set up the PDF styling first
      doc.setFontSize(22);
      doc.setTextColor(81, 45, 168);
      doc.text("Optima Bank - Voucher", 105, 25, { align: "center" });

      // Add voucher image if available
      if (voucher.image) {
        try {
          const imageData = await imageToBase64(voucher.image);
          // Add a subtle shadow effect
          doc.setFillColor(200, 200, 200);
          doc.rect(47, 37, 116, 62, "F");

          // Main image - slightly smaller to fit better
          doc.addImage(imageData, "JPEG", 45, 35, 120, 65);
        } catch (imageError) {
          console.warn("Could not load voucher image for PDF:", imageError);
        }
      }

      // Add voucher details with better spacing
      const contentStartY = voucher.image ? 110 : 45;

      doc.setFontSize(18);
      doc.setTextColor(81, 45, 168);
      doc.text(`${voucher.title}`, 105, contentStartY, { align: "center" });

      // Add separator line
      doc.setDrawColor(81, 45, 168);
      doc.setLineWidth(1);
      doc.line(25, contentStartY + 5, 185, contentStartY + 5);

      // Voucher details with consistent spacing
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Description: ${voucher.description}`, 25, contentStartY + 18);
      doc.text(
        `Points Redeemed: ${voucher.points * voucher.quantity}`,
        25,
        contentStartY + 30
      );
      doc.text(`Quantity: ${voucher.quantity}`, 25, contentStartY + 42);
      doc.text(`Redeemed by: ${userEmail}`, 25, contentStartY + 54);
      doc.text(
        `Date: ${new Date().toLocaleDateString()}`,
        25,
        contentStartY + 66
      );

      // Voucher code section - smaller and better positioned
      const voucherCode = `OB-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      // Voucher code background - smaller height
      doc.setFillColor(81, 45, 168);
      doc.rect(25, contentStartY + 80, 160, 18, "F");

      // Voucher code text
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text(`Voucher Code: ${voucherCode}`, 105, contentStartY + 92, {
        align: "center",
      });

      // Terms and conditions - better positioned and sized
      const termsStartY = contentStartY + 110;

      // Background box for terms & conditions - fits within borders
      doc.setFillColor(248, 249, 250);
      doc.rect(25, termsStartY, 160, 45, "F");

      // Border for terms section
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(25, termsStartY, 160, 45);

      // Terms title
      doc.setFontSize(11);
      doc.setTextColor(81, 45, 168);
      doc.text("Terms & Conditions:", 30, termsStartY + 10);

      // Terms content with proper spacing
      const terms = [
        "This voucher is valid for 6 months from the date of issue",
        "This voucher cannot be exchanged for cash",
        "Present this voucher at participating merchants",
      ];

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      terms.forEach((term, termIndex) => {
        const yPosition = termsStartY + 22 + termIndex * 10;
        doc.text("•", 30, yPosition);
        doc.text(term, 35, yPosition);
      });

      // Main border
      doc.setDrawColor(81, 45, 168);
      doc.setLineWidth(4);
      doc.rect(15, 15, 180, 257);
    } catch (error) {
      console.error(`Error generating PDF for voucher ${index}:`, error);
      // Continue with next voucher even if one fails
    }
  }

  // Download the PDF
  const fileName = `Voucher_Bundle_${Date.now()}.pdf`;
  doc.save(fileName);
};
