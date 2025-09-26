"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { GiTwoCoins } from "react-icons/gi";
import {
  FaDownload,
  FaCalendar,
  FaHistory,
  FaFileDownload,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import {
  getUser,
  fetchRedemptionHistory,
  generateVoucherPDF,
  generateAllVouchersPDF,
} from "./action";
import toast, { Toaster } from "react-hot-toast";
import { resolveVoucherImage } from "@/lib/utils";

export default function VoucherHistoryPage() {
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<Record<string, unknown>[]>([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState<
    Record<string, unknown>[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

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

  // Fetch redemption history
  useEffect(() => {
    const loadRedemptionHistory = async () => {
      if (!user?.id) return;

      const result = await fetchRedemptionHistory(user.id);

      if (result.error) {
        setError(result.error);
        toast.error(result.error, {
          duration: 4000,
          position: "top-center",
        });
      } else if (result.message && result.data.length === 0) {
        setError(result.message);
      } else {
        setRedemptions(result.data);
        setFilteredRedemptions(result.data);
      }
    };

    if (user?.id) {
      loadRedemptionHistory();
    }
  }, [user?.id]);

  // Filter redemptions based on search term and date range
  useEffect(() => {
    let filtered = redemptions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((redemption) => {
        const voucher = redemption.voucher as Record<string, unknown>;
        const title = (voucher.title as string).toLowerCase();
        const description = (voucher.description as string).toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return title.includes(searchLower) || description.includes(searchLower);
      });
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter((redemption) => {
        const redemptionDate = new Date(redemption.redeemed_at as string);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo + "T23:59:59") : null; // Include the entire day

        let isWithinRange = true;

        if (fromDate && redemptionDate < fromDate) {
          isWithinRange = false;
        }

        if (toDate && redemptionDate > toDate) {
          isWithinRange = false;
        }

        return isWithinRange;
      });
    }

    setFilteredRedemptions(filtered);
  }, [searchTerm, dateFrom, dateTo, redemptions]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  // Handle individual voucher download
  const handleDownloadVoucher = (redemption: Record<string, unknown>) => {
    if (!user?.email) return;

    const voucher = redemption.voucher as Record<string, unknown>;
    const voucherData = {
      title: voucher.title as string,
      description: voucher.description as string,
      points: redemption.points_used as number,
      quantity: redemption.quantity as number,
    };

    try {
      generateVoucherPDF(
        voucherData,
        user.email,
        new Date(redemption.redeemed_at as string).toLocaleDateString()
      );
      toast.success(`Downloaded ${voucher.title} voucher`, {
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate voucher PDF", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  // Handle download all vouchers
  const handleDownloadAll = () => {
    if (!user?.email || filteredRedemptions.length === 0) return;

    try {
      generateAllVouchersPDF(
        filteredRedemptions.map((redemption) => ({
          voucher: redemption.voucher as { title: string; description: string },
          points_used: redemption.points_used as number,
          quantity: redemption.quantity as number,
          redeemed_at: redemption.redeemed_at as string,
        })),
        user.email
      );
      toast.success(
        `Downloaded ${filteredRedemptions.length} vouchers as bundle`,
        {
          duration: 3000,
          position: "top-center",
        }
      );
    } catch (error) {
      console.error("Error generating bundle PDF:", error);
      toast.error("Failed to generate voucher bundle", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  // Map category_id to names
  const categoryMap: Record<number, string> = {
    1: "Sport",
    2: "Food",
    3: "Entertainment",
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />
      <Navbar user={user ?? undefined} />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FaHistory className="text-2xl text-[#512da8]" />
              <h1 className="text-2xl font-bold text-gray-800">
                Voucher History
              </h1>
            </div>
            {filteredRedemptions.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                className="bg-[#512da8] text-white px-4 py-2 hover:bg-[#6a3fe3] flex items-center gap-2"
              >
                <FaFileDownload />
                Download All ({filteredRedemptions.length})
              </Button>
            )}
          </div>

          {/* Statistics Summary - Moved to top */}
          {!error && redemptions.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Redemption Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-[#512da8] mb-2">
                    {redemptions.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Total Vouchers Redeemed
                  </div>
                </div>
                <div className="text-center bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {redemptions.reduce(
                      (sum, r) => sum + (r.points_used as number),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Total Points Used
                  </div>
                </div>
                <div className="text-center bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {redemptions.reduce(
                      (sum, r) => sum + (r.quantity as number),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Total Items Redeemed
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Bar */}
          {!error && redemptions.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search vouchers by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#512da8] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Filter Toggle Button */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 flex items-center gap-2 ${
                      showFilters || hasActiveFilters
                        ? "bg-[#512da8] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <FaFilter />
                    Filters{" "}
                    {hasActiveFilters &&
                      `(${
                        [searchTerm, dateFrom, dateTo].filter(Boolean).length
                      })`}
                  </Button>

                  {hasActiveFilters && (
                    <Button
                      onClick={clearAllFilters}
                      className="px-4 py-3 bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                    >
                      <FaTimes />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Expandable Date Filters */}
              {(showFilters || hasActiveFilters) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#512da8] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#512da8] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Results Summary */}
              {hasActiveFilters && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                      <strong>
                        Found {filteredRedemptions.length} voucher(s)
                      </strong>
                      {filteredRedemptions.length !== redemptions.length && (
                        <span> out of {redemptions.length} total</span>
                      )}
                      {searchTerm && <span> matching "{searchTerm}"</span>}
                      {(dateFrom || dateTo) && (
                        <span>
                          {" "}
                          {dateFrom && dateTo
                            ? `between ${dateFrom} and ${dateTo}`
                            : dateFrom
                            ? `from ${dateFrom}`
                            : `until ${dateTo}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error or No Data Message */}
          {error && (
            <div className="text-center py-12">
              <FaHistory className="text-gray-400 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                {error === "Redemptions table not found"
                  ? "Voucher history is not available yet. Redeem some vouchers to see them here!"
                  : "Unable to load voucher history"}
              </p>
              <Button
                onClick={() => router.push("/home")}
                className="bg-[#512da8] text-white px-6 py-2"
              >
                Browse Vouchers
              </Button>
            </div>
          )}

          {/* No Redemptions Message */}
          {!error && redemptions.length === 0 && (
            <div className="text-center py-12">
              <FaHistory className="text-gray-400 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                You haven't redeemed any vouchers yet
              </p>
              <Button
                onClick={() => router.push("/home")}
                className="bg-[#512da8] text-white px-6 py-2"
              >
                Browse Vouchers
              </Button>
            </div>
          )}

          {/* No Search Results Message */}
          {!error &&
            redemptions.length > 0 &&
            filteredRedemptions.length === 0 &&
            hasActiveFilters && (
              <div className="text-center py-12">
                <FaSearch className="text-gray-400 text-6xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  No vouchers found matching your search criteria
                </p>
                <Button
                  onClick={clearAllFilters}
                  className="bg-[#512da8] text-white px-6 py-2"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

          {/* Redemptions List */}
          {!error && filteredRedemptions.length > 0 && (
            <div className="space-y-4">
              {filteredRedemptions.map((redemption) => {
                const voucher = redemption.voucher as Record<string, unknown>;
                const redemptionDate = new Date(
                  redemption.redeemed_at as string
                );

                return (
                  <div
                    key={redemption.id as number}
                    className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Voucher Image */}
                    <img
                      src={resolveVoucherImage(voucher.image)}
                      alt={voucher.title as string}
                      className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                    />

                    {/* Voucher Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {voucher.title as string}
                        </h3>
                        <span className="text-sm font-medium text-[#512da8] bg-purple-50 px-3 py-1 rounded-full">
                          {categoryMap[voucher.category_id as number] ||
                            "Other"}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {voucher.description as string}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <GiTwoCoins className="text-yellow-500" />
                            <span>
                              {redemption.points_used as number} points used
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Qty: {redemption.quantity as number}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaCalendar className="text-gray-400" />
                            <span>{redemptionDate.toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleDownloadVoucher(redemption)}
                          className="bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700 flex items-center gap-2"
                        >
                          <FaDownload />
                          Re-download
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
