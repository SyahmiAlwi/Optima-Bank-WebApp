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
export const generateVoucherPDF = async (
  voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
    image?: string;
  },
  userEmail: string,
  redemptionDate?: string
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
      `Redemption Date: ${redemptionDate || new Date().toLocaleDateString()}`,
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
    doc.setFontSize(12);
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
      "This is a re-downloaded copy of your original voucher",
    ];

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    terms.forEach((term, index) => {
      const yPosition = termsStartY + 22 + index * 8;
      doc.text("•", 30, yPosition);
      doc.text(term, 35, yPosition);
    });

    // Main border
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(4);
    doc.rect(15, 15, 180, 257);

    // Download the PDF
    const fileName = `${voucher.title.replace(
      /\s+/g,
      "_"
    )}_redownload_${Date.now()}.pdf`;
    doc.save(fileName);

    return voucherCode;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Generate and download all vouchers as a bundle
export const generateAllVouchersPDF = async (
  redemptions: Array<{
    voucher: {
      title: string;
      description: string;
      image?: string;
    };
    points_used: number;
    quantity: number;
    redeemed_at: string;
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

  for (let index = 0; index < redemptions.length; index++) {
    const redemption = redemptions[index];

    // Add new page for each voucher except the first one
    if (index > 0) {
      doc.addPage();
    }

    const voucher = redemption.voucher;

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
        `Points Redeemed: ${redemption.points_used}`,
        25,
        contentStartY + 30
      );
      doc.text(`Quantity: ${redemption.quantity}`, 25, contentStartY + 42);
      doc.text(`Redeemed by: ${userEmail}`, 25, contentStartY + 54);
      doc.text(
        `Redemption Date: ${new Date(
          redemption.redeemed_at
        ).toLocaleDateString()}`,
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
      doc.setFontSize(12);
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
        "This is a re-downloaded copy of your original voucher",
      ];

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      terms.forEach((term, termIndex) => {
        const yPosition = termsStartY + 22 + termIndex * 8;
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
  const fileName = `Voucher_History_Bundle_${Date.now()}.pdf`;
  doc.save(fileName);
};
