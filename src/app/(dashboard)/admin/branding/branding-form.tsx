"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette } from "lucide-react";

interface BrandingFormProps {
  orgId: string;
}

const DEFAULT_PRIMARY = "#0F172A";
const DEFAULT_SECONDARY = "#334155";
const DEFAULT_ACCENT = "#0369A1";

export function BrandingForm({ orgId }: BrandingFormProps) {
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [logo, setLogo] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch(`/api/organizations/${orgId}/branding`);
        if (res.ok) {
          const data = await res.json();
          setPrimaryColor(data.primaryColor || DEFAULT_PRIMARY);
          setSecondaryColor(data.secondaryColor || DEFAULT_SECONDARY);
          setAccentColor(data.accentColor || DEFAULT_ACCENT);
          setLogo(data.logo || "");
        }
      } catch {
        // Keep defaults on error
      } finally {
        setFetching(false);
      }
    }

    fetchBranding();
  }, [orgId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/organizations/${orgId}/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          accentColor,
          logo: logo || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess("Branding updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-3">
          <Palette className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            Branding
          </h1>
          <p className="text-sm text-secondary">
            Customize your white-label theme colors and logo.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
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

          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#0F172A"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground placeholder-gray-400 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#334155"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground placeholder-gray-400 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#0369A1"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground placeholder-gray-400 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <Input
            label="Logo URL"
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://example.com/logo.png"
          />

          <div className="pt-2">
            <Button type="submit" loading={loading}>
              Save Branding
            </Button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Live Preview
          </h2>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            {/* Preview Header */}
            <div className="mb-6 flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo preview"
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  B
                </div>
              )}
              <span
                className="font-heading text-lg font-bold"
                style={{ color: primaryColor }}
              >
                Your Brand
              </span>
            </div>

            {/* Preview Card */}
            <div className="rounded-lg border border-gray-200 p-5">
              <h3
                className="font-heading text-base font-semibold"
                style={{ color: primaryColor }}
              >
                Upcoming Class
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: secondaryColor }}
              >
                Join us for an energizing morning session. Perfect for all
                levels with expert guidance.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  Book Now
                </button>
                <button
                  type="button"
                  className="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    borderColor: accentColor,
                    color: accentColor,
                  }}
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Preview Navigation */}
            <div className="mt-6 flex gap-4 border-t border-gray-200 pt-4">
              {["Home", "Classes", "Packages", "Contact"].map((item) => (
                <span
                  key={item}
                  className="text-sm font-medium"
                  style={{ color: secondaryColor }}
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Color Swatches */}
            <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="text-xs text-gray-500">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="text-xs text-gray-500">Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-xs text-gray-500">Accent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
