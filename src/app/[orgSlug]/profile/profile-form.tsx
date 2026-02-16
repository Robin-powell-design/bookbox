"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Package,
  Calendar,
  ImageIcon,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
  initialAvatar: string | null;
  memberSince: string;
}

interface ActivePackage {
  id: string;
  packageName: string;
  packageDescription: string | null;
  packageType: "BUNDLE" | "MONTHLY";
  totalClasses: number | null;
  remainingClasses: number | null;
  expiresAt: string | null;
  purchasedAt: string;
  organizationName: string;
  organizationSlug: string;
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialAvatar,
  memberSince,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [packages, setPackages] = useState<ActivePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/profile/packages");
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch {
        // Silently fail for packages
      } finally {
        setPackagesLoading(false);
      }
    }

    fetchPackages();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatar: avatar || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-3">
          <User className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            My Profile
          </h1>
          <p className="text-sm text-secondary">
            Manage your account details and preferences.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
          >
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-secondary">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-foreground">{initialEmail}</span>
              </div>
              <p className="text-xs text-gray-400">
                Email cannot be changed here.
              </p>
            </div>

            <Input
              label="Avatar URL"
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />

            {/* Avatar Preview */}
            {avatar && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-secondary">
                  Avatar Preview
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatar}
                    alt="Avatar preview"
                    className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.display = "block";
                    }}
                  />
                  <p className="text-sm text-secondary">
                    This is how your avatar will appear.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Member Since Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
              <Calendar className="h-4 w-4" />
              <span>Member Since</span>
            </div>
            <p className="mt-2 font-heading text-lg font-semibold text-primary">
              {format(new Date(memberSince), "MMMM d, yyyy")}
            </p>
          </div>

          {/* Profile Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = parent.querySelector(
                        "[data-fallback]"
                      ) as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                data-fallback
                className={`h-20 w-20 items-center justify-center rounded-full bg-accent/10 ${
                  avatar ? "hidden" : "flex"
                }`}
              >
                <User className="h-10 w-10 text-accent" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="font-heading text-lg font-semibold text-primary">
                {name}
              </p>
              <p className="mt-1 text-sm text-secondary">{initialEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Packages Section */}
      <section>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-xl font-semibold text-primary">
            Active Packages
          </h2>
        </div>

        {packagesLoading ? (
          <div className="mt-4 flex items-center justify-center py-12">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : packages.length === 0 ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-secondary">
              No active packages. Purchase a package to get started!
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-heading text-lg font-semibold text-primary">
                    {pkg.packageName}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      pkg.packageType === "BUNDLE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {pkg.packageType}
                  </span>
                </div>

                {pkg.packageDescription && (
                  <p className="mt-1 text-sm text-secondary">
                    {pkg.packageDescription}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  {pkg.remainingClasses !== null && (
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <ImageIcon className="h-4 w-4" />
                      <span>
                        {pkg.remainingClasses} of {pkg.totalClasses} classes
                        remaining
                      </span>
                    </div>
                  )}

                  {pkg.expiresAt && (
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Clock className="h-4 w-4" />
                      <span>
                        Expires{" "}
                        {format(new Date(pkg.expiresAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Purchased{" "}
                      {format(new Date(pkg.purchasedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400">
                    {pkg.organizationName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
