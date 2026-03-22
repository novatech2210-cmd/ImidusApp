"use client";

import { AdminAPI, CustomerSegment, SegmentCounts } from "@/lib/api";
import {
    CircleStackIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSegment[]>([]);
  const [counts, setCounts] = useState<SegmentCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSegment | null>(null);

  useEffect(() => {
    fetchData();
  }, [segmentFilter, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch segment counts
      const countsRes = await AdminAPI.getCustomerSegments();
      if (countsRes.success) {
        setCounts(countsRes.data);
      }

      // Fetch customer list
      const segment = segmentFilter === "all" ? undefined : segmentFilter;
      const term = searchQuery || undefined;

      const customersRes = await AdminAPI.getCustomers({
        segment,
        searchTerm: term,
        limit: 50,
      });
      if (customersRes.success) {
        setCustomers(customersRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadge = (segment: string) => {
    const styles: Record<string, string> = {
      "High-spend": "bg-purple-100 text-purple-800",
      Frequent: "bg-blue-100 text-blue-800",
      Recent: "bg-green-100 text-green-800",
      "At-risk": "bg-red-100 text-red-800",
      New: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[segment] || "bg-gray-100 text-gray-800"}`}
      >
        {segment}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && !customers.length) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Customer CRM
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your customer base and RFM segments
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {counts && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
            <p className="text-2xl font-black text-white">{counts.total}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-purple-400 uppercase font-bold">
              High-Spend
            </p>
            <p className="text-2xl font-black text-white">{counts.highSpend}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-blue-400 uppercase font-bold">
              Frequent
            </p>
            <p className="text-2xl font-black text-white">{counts.frequent}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-green-400 uppercase font-bold">Recent</p>
            <p className="text-2xl font-black text-white">{counts.recent}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-red-400 uppercase font-bold">At-Risk</p>
            <p className="text-2xl font-black text-white">{counts.atRisk}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-yellow-400 uppercase font-bold">New</p>
            <p className="text-2xl font-black text-white">
              {counts.newCustomers}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Segment Filter */}
        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          aria-label="Filter by customer segment"
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Segments</option>
          <option value="High-spend">High-Spend</option>
          <option value="Frequent">Frequent</option>
          <option value="Recent">Recent</option>
          <option value="At-risk">At-Risk</option>
          <option value="New">New Customers</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  LTV
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.customerID}
                    className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-white">
                            {customer.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: #{customer.customerID}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSegmentBadge(customer.segment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {customer.email || "No email"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {customer.orderCount} orders
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-400">
                        ${customer.lifetimeValue?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-yellow-500">
                        <CircleStackIcon className="w-4 h-4 mr-1" />
                        {customer.earnedPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-400">
                        {formatDate(customer.lastOrderDate ?? null)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Overlay (Simple version) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-start gap-6">
              <div className="h-24 w-24 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
                <UserIcon className="h-12 w-12 text-gray-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-white uppercase">
                  {selectedCustomer.name}
                </h2>
                <div className="mt-2 flex gap-2">
                  {getSegmentBadge(selectedCustomer.segment)}
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      Contact Info
                    </p>
                    <p className="text-white mt-1">
                      {selectedCustomer.email || "N/A"}
                    </p>
                    <p className="text-white">
                      {selectedCustomer.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      Loyalty Points
                    </p>
                    <p className="text-2xl font-bold text-yellow-500 mt-1">
                      {selectedCustomer.earnedPoints} pts
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      Orders
                    </p>
                    <p className="text-xl font-bold text-white">
                      {selectedCustomer.orderCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      LTV
                    </p>
                    <p className="text-xl font-bold text-green-400">
                      ${selectedCustomer.lifetimeValue?.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      Last Visit
                    </p>
                    <p className="text-sm font-bold text-white mt-1">
                      {formatDate(selectedCustomer.lastOrderDate ?? null)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button className="flex-1 bg-blue-600 p-3 rounded-lg font-bold text-white hover:bg-blue-700">
                Send Notification
              </button>
              <button className="flex-1 border border-gray-700 p-3 rounded-lg font-bold text-gray-300 hover:bg-gray-700">
                View All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
