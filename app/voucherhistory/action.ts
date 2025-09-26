"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import jsPDF from "jspdf";

// Fetch current logged-in user and their profile
export const getUser = async () => {
  const supabase = supabaseBrowser();

  // Get user from auth
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Error fetching user:", error);
    return null;
  }

  // Fetch user profile from 'profiles' table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, totalpoints")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    totalpoints: profile.totalpoints,
  };
};

// Fetch user's redemption history
export const fetchRedemptionHistory = async (userId: string) => {
  const supabase = supabaseBrowser();

  try {
    // First, try to fetch from redemptions table
    const { data: redemptions, error: redemptionError } = await supabase
      .from("redemptions")
      .select(
        `
        id,
        voucher_id,
        points_used,
        quantity,
        redeemed_at,
        voucher (
          id,
          title,
          description,
          image,
          category_id,
          terms
        )
      `
      )
      .eq("user_id", userId)
      .order("redeemed_at", { ascending: false });

    if (redemptionError) {
      console.error("Error fetching redemptions:", redemptionError);

      // If redemptions table doesn't exist, return empty array with a message
      if (redemptionError.code === "42P01") {
        console.log("Redemptions table doesn't exist");
        return { data: [], message: "Redemptions table not found" };
      }

      return { data: [], error: redemptionError.message };
    }

    return { data: redemptions || [], message: null };
  } catch (error) {
    console.error("Unexpected error fetching redemption history:", error);
    return { data: [], error: "An unexpected error occurred" };
  }
};

// Generate and download individual voucher PDF
export const generateVoucherPDF = (
  voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
  },
  userEmail: string,
  redemptionDate?: string
) => {
  const doc = new jsPDF();

  // Set up the PDF styling
  doc.setFontSize(20);
  doc.setTextColor(81, 45, 168); // Purple color #512da8
  doc.text("Optima Bank - Voucher", 20, 30);

  // Add voucher details
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`Voucher: ${voucher.title}`, 20, 50);

  doc.setFontSize(12);
  doc.text(`Description: ${voucher.description}`, 20, 70);
  doc.text(`Points Redeemed: ${voucher.points * voucher.quantity}`, 20, 85);
  doc.text(`Quantity: ${voucher.quantity}`, 20, 100);
  doc.text(`Redeemed by: ${userEmail}`, 20, 115);
  doc.text(
    `Redemption Date: ${redemptionDate || new Date().toLocaleDateString()}`,
    20,
    130
  );

  // Add a voucher code
  const voucherCode = `OB-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;
  doc.setFontSize(14);
  doc.setTextColor(81, 45, 168);
  doc.text(`Voucher Code: ${voucherCode}`, 20, 150);

  // Add terms and conditions
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Terms & Conditions:", 20, 170);
  doc.text(
    "- This voucher is valid for 6 months from the date of issue",
    20,
    180
  );
  doc.text("- This voucher cannot be exchanged for cash", 20, 190);
  doc.text("- Present this voucher at participating merchants", 20, 200);
  doc.text("- This is a re-downloaded copy of your original voucher", 20, 210);

  // Add a border
  doc.setDrawColor(81, 45, 168);
  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 267);

  // Download the PDF
  const fileName = `${voucher.title.replace(
    /\s+/g,
    "_"
  )}_redownload_${Date.now()}.pdf`;
  doc.save(fileName);

  return voucherCode;
};

// Generate and download all vouchers as a bundle
export const generateAllVouchersPDF = (
  redemptions: Array<{
    voucher: {
      title: string;
      description: string;
    };
    points_used: number;
    quantity: number;
    redeemed_at: string;
  }>,
  userEmail: string
) => {
  const doc = new jsPDF();

  redemptions.forEach((redemption, index) => {
    // Add new page for each voucher except the first one
    if (index > 0) {
      doc.addPage();
    }

    const voucher = redemption.voucher;

    // Set up the PDF styling
    doc.setFontSize(20);
    doc.setTextColor(81, 45, 168);
    doc.text("Optima Bank - Voucher", 20, 30);

    // Add voucher details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Voucher: ${voucher.title}`, 20, 50);

    doc.setFontSize(12);
    doc.text(`Description: ${voucher.description}`, 20, 70);
    doc.text(`Points Redeemed: ${redemption.points_used}`, 20, 85);
    doc.text(`Quantity: ${redemption.quantity}`, 20, 100);
    doc.text(`Redeemed by: ${userEmail}`, 20, 115);
    doc.text(
      `Redemption Date: ${new Date(
        redemption.redeemed_at
      ).toLocaleDateString()}`,
      20,
      130
    );

    // Add a voucher code
    const voucherCode = `OB-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    doc.setFontSize(14);
    doc.setTextColor(81, 45, 168);
    doc.text(`Voucher Code: ${voucherCode}`, 20, 150);

    // Add terms and conditions
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Terms & Conditions:", 20, 170);
    doc.text(
      "- This voucher is valid for 6 months from the date of issue",
      20,
      180
    );
    doc.text("- This voucher cannot be exchanged for cash", 20, 190);
    doc.text("- Present this voucher at participating merchants", 20, 200);
    doc.text(
      "- This is a re-downloaded copy of your original voucher",
      20,
      210
    );

    // Add a border
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(2);
    doc.rect(10, 10, 190, 267);
  });

  // Download the PDF
  const fileName = `Voucher_History_Bundle_${Date.now()}.pdf`;
  doc.save(fileName);
};
