"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

interface TargetingRules {
  segments?: string[];
  conditions?: {
    "high-spend"?: { lifetime_value: { gt: number } };
    frequent?: { visit_count: { gt: number } };
    recent?: { last_order_days: { lt: number } };
    birthday?: { days_range: number };
  };
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  bg_gradient?: string;
  cta_text?: string;
  cta_link?: string;
  targeting_rules: TargetingRules;
  start_date?: string;
  end_date?: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  bg_gradient: string;
  cta_text: string;
  cta_link: string;
  start_date: string;
  end_date: string;
  priority: number;
  active: boolean;
  segments: string[];
  highSpendThreshold: number;
  frequentThreshold: number;
  recentDaysThreshold: number;
  birthdayDaysRange: number;
}

type FormMode = "list" | "create" | "edit";

// ============================================================================
// Constants
// ============================================================================

const AVAILABLE_SEGMENTS = [
  { id: "all", label: "All Customers", description: "Show to everyone" },
  { id: "new", label: "New Customers", description: "First-time visitors" },
  {
    id: "high-spend",
    label: "High Spenders",
    description: "Lifetime value > threshold",
  },
  {
    id: "frequent",
    label: "Frequent Diners",
    description: "Visit count > threshold",
  },
  {
    id: "recent",
    label: "Recent Customers",
    description: "Last order within X days",
  },
  {
    id: "birthday",
    label: "Birthday Week",
    description: "Birthday within X days",
  },
];

const GRADIENT_PRESETS = [
  {
    name: "Blue",
    value: "linear-gradient(135deg, #1E5AA8 0%, #174785 100%)",
  },
  {
    name: "Gold",
    value: "linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)",
  },
  {
    name: "Green",
    value: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
  },
  { name: "Red", value: "linear-gradient(135deg, #E91E63 0%, #C2185B 100%)" },
  {
    name: "Purple",
    value: "linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)",
  },
  {
    name: "Orange",
    value: "linear-gradient(135deg, #FF5722 0%, #E64A19 100%)",
  },
  { name: "Dark", value: "linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)" },
];

const DEFAULT_FORM_DATA: BannerFormData = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  bg_gradient: GRADIENT_PRESETS[0].value,
  cta_text: "Order Now",
  cta_link: "/menu",
  start_date: "",
  end_date: "",
  priority: 50,
  active: true,
  segments: ["all"],
  highSpendThreshold: 500,
  frequentThreshold: 10,
  recentDaysThreshold: 14,
  birthdayDaysRange: 7,
};

// ============================================================================
// Component
// ============================================================================

export function BannerManager() {
  // State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>("list");
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/banners?limit=100");
      const data = await response.json();

      if (data.success) {
        setBanners(data.data);
      } else {
        setError(data.error || "Failed to fetch banners");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error fetching banners:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const openCreateForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setPreviewImage(null);
    setEditingBanner(null);
    setMode("create");
  };

  const openEditForm = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      image_url: banner.image_url,
      bg_gradient:
        banner.bg_gradient ||
        "linear-gradient(135deg, #1E5AA8 0%, #174785 100%)",
      cta_text: banner.cta_text || "Order Now",
      cta_link: banner.cta_link || "/menu",
      start_date: banner.start_date
        ? banner.start_date.substring(0, 16)
        : "",
      end_date: banner.end_date ? banner.end_date.substring(0, 16) : "",
      priority: banner.priority,
      active: banner.active,
      segments: banner.targeting_rules.segments || ["all"],
      highSpendThreshold:
        banner.targeting_rules.conditions?.["high-spend"]?.lifetime_value?.gt ||
        500,
      frequentThreshold:
        banner.targeting_rules.conditions?.frequent?.visit_count?.gt || 10,
      recentDaysThreshold:
        banner.targeting_rules.conditions?.recent?.last_order_days?.lt || 14,
      birthdayDaysRange:
        banner.targeting_rules.conditions?.birthday?.days_range || 7,
    });
    setPreviewImage(banner.image_url);
    setMode("edit");
  };

  const closeForm = () => {
    setMode("list");
    setEditingBanner(null);
    setFormData(DEFAULT_FORM_DATA);
    setPreviewImage(null);
  };

  const handleInputChange = (
    field: keyof BannerFormData,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSegment = (segmentId: string) => {
    setFormData((prev) => {
      const segments = prev.segments.includes(segmentId)
        ? prev.segments.filter((s) => s !== segmentId)
        : [...prev.segments, segmentId];
      return { ...prev, segments };
    });
  };

  // ============================================================================
  // Image Upload
  // ============================================================================

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(30);

      const response = await fetch("/api/admin/banners/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      const data = await response.json();

      if (data.success) {
        handleInputChange("image_url", data.url);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        setError(data.error || "Failed to upload image");
        setUploadProgress(0);
      }
    } catch (err) {
      setError("Failed to upload image");
      setUploadProgress(0);
      console.error("Upload error:", err);
    }
  };

  // ============================================================================
  // Form Submission
  // ============================================================================

  const buildTargetingRules = (): TargetingRules => {
    const rules: TargetingRules = {
      segments: formData.segments,
    };

    if (
      formData.segments.includes("high-spend") ||
      formData.segments.includes("frequent") ||
      formData.segments.includes("recent") ||
      formData.segments.includes("birthday")
    ) {
      rules.conditions = {};

      if (formData.segments.includes("high-spend")) {
        rules.conditions["high-spend"] = {
          lifetime_value: { gt: formData.highSpendThreshold },
        };
      }
      if (formData.segments.includes("frequent")) {
        rules.conditions.frequent = {
          visit_count: { gt: formData.frequentThreshold },
        };
      }
      if (formData.segments.includes("recent")) {
        rules.conditions.recent = {
          last_order_days: { lt: formData.recentDaysThreshold },
        };
      }
      if (formData.segments.includes("birthday")) {
        rules.conditions.birthday = { days_range: formData.birthdayDaysRange };
      }
    }

    return rules;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        image_url: formData.image_url || "/images/banners/default.jpg",
        bg_gradient: formData.bg_gradient,
        cta_text: formData.cta_text,
        cta_link: formData.cta_link,
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString()
          : undefined,
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : undefined,
        priority: formData.priority,
        active: formData.active,
        targeting_rules: buildTargetingRules(),
      };

      const url =
        mode === "edit" && editingBanner
          ? `/api/admin/banners/${editingBanner.id}`
          : "/api/admin/banners";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        closeForm();
        fetchBanners();
      } else {
        setError(data.error || "Failed to save banner");
      }
    } catch (err) {
      setError("Failed to save banner");
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Delete Handler
  // ============================================================================

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setDeleteConfirmId(null);
        fetchBanners();
      } else {
        setError(data.error || "Failed to delete banner");
      }
    } catch (err) {
      setError("Failed to delete banner");
      console.error("Delete error:", err);
    }
  };

  // ============================================================================
  // Render: Banner List
  // ============================================================================

  const renderBannerList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A2E] uppercase tracking-tight">
            Banner Management
          </h2>
          <p className="text-[#71717A] text-sm mt-1">
            Create and manage homepage carousel banners
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="btn btn-gold flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Banner
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-[#1E5AA8] animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
            No Banners Yet
          </h3>
          <p className="text-[#71717A] mb-4">
            Create your first banner to get started
          </p>
          <button
            onClick={openCreateForm}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Banner
          </button>
        </div>
      ) : (
        /* Banner Table */
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Banner
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Targeting
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                  {/* Banner Preview */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{ background: banner.bg_gradient }}
                      >
                        {banner.image_url && (
                          <Image
                            src={banner.image_url}
                            alt=""
                            width={64}
                            height={40}
                            className="w-full h-full object-cover opacity-50"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A2E] text-sm">
                          {banner.title}
                        </p>
                        <p className="text-[#71717A] text-xs">
                          {banner.subtitle}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        banner.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          banner.active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {banner.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Targeting */}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(banner.targeting_rules.segments || ["all"]).map(
                        (segment) => (
                          <span
                            key={segment}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                          >
                            <TagIcon className="w-3 h-3" />
                            {segment}
                          </span>
                        )
                      )}
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="px-4 py-4">
                    {banner.start_date || banner.end_date ? (
                      <div className="text-xs text-[#71717A]">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {banner.start_date
                            ? new Date(banner.start_date).toLocaleDateString()
                            : "Now"}
                          {" - "}
                          {banner.end_date
                            ? new Date(banner.end_date).toLocaleDateString()
                            : "Forever"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#71717A]">Always</span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                      {banner.priority}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(banner)}
                        className="p-2 text-[#1E5AA8] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          window.open(`/?preview=${banner.id}`, "_blank")
                        }
                        className="p-2 text-[#71717A] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {deleteConfirmId === banner.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(banner.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            title="Confirm Delete"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-2 text-[#71717A] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(banner.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // Render: Banner Form
  // ============================================================================

  const BannerForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A2E] uppercase tracking-tight">
            {mode === "edit" ? "Edit Banner" : "Create Banner"}
          </h2>
          <p className="text-[#71717A] text-sm mt-1">
            {mode === "edit"
              ? "Update banner details and targeting"
              : "Add a new banner to the carousel"}
          </p>
        </div>
        <button
          type="button"
          onClick={closeForm}
          className="p-2 text-[#71717A] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider">
            Basic Information
          </h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="input w-full"
              placeholder="e.g., Welcome to IMIDUSAPP"
              required
              maxLength={255}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => handleInputChange("subtitle", e.target.value)}
              className="input w-full"
              placeholder="e.g., Your First Order Awaits"
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="input w-full min-h-[100px]"
              placeholder="Brief description shown below the subtitle..."
            />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                CTA Text
              </label>
              <input
                type="text"
                value={formData.cta_text}
                onChange={(e) => handleInputChange("cta_text", e.target.value)}
                className="input w-full"
                placeholder="e.g., Order Now"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                CTA Link
              </label>
              <input
                type="text"
                value={formData.cta_link}
                onChange={(e) => handleInputChange("cta_link", e.target.value)}
                className="input w-full"
                placeholder="e.g., /menu"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Banner Image
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1E5AA8] transition-colors">
              {previewImage ? (
                <div className="relative">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      handleInputChange("image_url", "");
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-[#71717A] text-sm mb-2">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-[#71717A] text-xs">
                    JPG, PNG, WebP up to 5MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E5AA8] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Background Gradient */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Background Gradient
            </label>
            <div className="grid grid-cols-7 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    handleInputChange("bg_gradient", preset.value)
                  }
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.bg_gradient === preset.value
                      ? "ring-2 ring-[#1E5AA8] ring-offset-2"
                      : ""
                  }`}
                  style={{ background: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Targeting & Scheduling */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider">
            Targeting Rules
          </h3>

          {/* Segments */}
          <div className="space-y-3">
            {AVAILABLE_SEGMENTS.map((segment) => (
              <label
                key={segment.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.segments.includes(segment.id)
                    ? "border-[#1E5AA8] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.segments.includes(segment.id)}
                  onChange={() => toggleSegment(segment.id)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-[#1A1A2E] text-sm">
                    {segment.label}
                  </p>
                  <p className="text-[#71717A] text-xs">{segment.description}</p>

                  {/* Threshold inputs for specific segments */}
                  {segment.id === "high-spend" &&
                    formData.segments.includes("high-spend") && (
                      <div className="mt-2">
                        <label className="text-xs text-[#71717A]">
                          Minimum lifetime value: $
                          <input
                            type="number"
                            value={formData.highSpendThreshold}
                            onChange={(e) =>
                              handleInputChange(
                                "highSpendThreshold",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 ml-1 px-2 py-1 border rounded text-sm"
                            min={0}
                          />
                        </label>
                      </div>
                    )}

                  {segment.id === "frequent" &&
                    formData.segments.includes("frequent") && (
                      <div className="mt-2">
                        <label className="text-xs text-[#71717A]">
                          Minimum visits:
                          <input
                            type="number"
                            value={formData.frequentThreshold}
                            onChange={(e) =>
                              handleInputChange(
                                "frequentThreshold",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 ml-1 px-2 py-1 border rounded text-sm"
                            min={0}
                          />
                        </label>
                      </div>
                    )}

                  {segment.id === "recent" &&
                    formData.segments.includes("recent") && (
                      <div className="mt-2">
                        <label className="text-xs text-[#71717A]">
                          Within last days:
                          <input
                            type="number"
                            value={formData.recentDaysThreshold}
                            onChange={(e) =>
                              handleInputChange(
                                "recentDaysThreshold",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 ml-1 px-2 py-1 border rounded text-sm"
                            min={1}
                          />
                        </label>
                      </div>
                    )}

                  {segment.id === "birthday" &&
                    formData.segments.includes("birthday") && (
                      <div className="mt-2">
                        <label className="text-xs text-[#71717A]">
                          Days range:
                          <input
                            type="number"
                            value={formData.birthdayDaysRange}
                            onChange={(e) =>
                              handleInputChange(
                                "birthdayDaysRange",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 ml-1 px-2 py-1 border rounded text-sm"
                            min={1}
                          />
                        </label>
                      </div>
                    )}
                </div>
              </label>
            ))}
          </div>

          <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider pt-4">
            Scheduling
          </h3>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) =>
                  handleInputChange("start_date", e.target.value)
                }
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Priority (0-100)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                value={formData.priority}
                onChange={(e) =>
                  handleInputChange("priority", parseInt(e.target.value))
                }
                className="flex-1"
              />
              <span className="w-12 text-center font-mono text-[#1A1A2E]">
                {formData.priority}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-1">
              Higher priority banners appear first in the carousel
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-[#1A1A2E]">Active Status</p>
              <p className="text-sm text-[#71717A]">
                Show this banner in the carousel
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleInputChange("active", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E5AA8]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={closeForm}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-gold flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              {mode === "edit" ? "Update Banner" : "Create Banner"}
            </>
          )}
        </button>
      </div>
    </form>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {mode === "list" ? renderBannerList() : <BannerForm />}
    </div>
  );
}

export default BannerManager;
