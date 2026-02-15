"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";

interface PackageFormProps {
  orgId: string;
}

export function PackageForm({ orgId }: PackageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"BUNDLE" | "MONTHLY">("BUNDLE");
  const [price, setPrice] = useState("");
  const [classCount, setClassCount] = useState("");
  const [durationDays, setDurationDays] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const body: Record<string, unknown> = {
        name,
        description: description || undefined,
        type,
        price: parseFloat(price) || 0,
        classCount:
          type === "BUNDLE" && classCount ? parseInt(classCount, 10) : null,
        durationDays:
          type === "MONTHLY" && durationDays
            ? parseInt(durationDays, 10)
            : null,
      };

      const res = await fetch(`/api/organizations/${orgId}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (Array.isArray(data.error)) {
          const errors: Record<string, string> = {};
          for (const err of data.error) {
            const field = err.path?.[0];
            if (field) {
              errors[field] = err.message;
            }
          }
          setFieldErrors(errors);
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      router.push("/admin/packages");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-3">
          <Package className="h-6 w-6 text-accent" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          New Package
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 10-Class Bundle"
          required
          error={fieldErrors.name}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-secondary">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground placeholder-gray-400 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {fieldErrors.description && (
            <p className="text-sm text-red-500">{fieldErrors.description}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-secondary">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "BUNDLE" | "MONTHLY")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="BUNDLE">Bundle</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          {fieldErrors.type && (
            <p className="text-sm text-red-500">{fieldErrors.type}</p>
          )}
        </div>

        <Input
          label="Price ($)"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          required
          error={fieldErrors.price}
        />

        {type === "BUNDLE" && (
          <Input
            label="Class Count"
            type="number"
            min="1"
            value={classCount}
            onChange={(e) => setClassCount(e.target.value)}
            placeholder="e.g. 10"
            error={fieldErrors.classCount}
          />
        )}

        {type === "MONTHLY" && (
          <Input
            label="Duration (days)"
            type="number"
            min="1"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="e.g. 30"
            error={fieldErrors.durationDays}
          />
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={loading}>
            Create Package
          </Button>
          <Link href="/admin/packages">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
