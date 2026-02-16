"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  cancellationHours: number;
  defaultCapacity: number;
}

interface SettingsFormProps {
  org: OrgSettings;
}

export function SettingsForm({ org }: SettingsFormProps) {
  const [name, setName] = useState(org.name);
  const [cancellationHours, setCancellationHours] = useState(
    org.cancellationHours
  );
  const [defaultCapacity, setDefaultCapacity] = useState(org.defaultCapacity);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/organizations/${org.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cancellationHours,
          defaultCapacity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
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
          <Settings className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            Settings
          </h1>
          <p className="text-sm text-secondary">
            Manage your organization settings and defaults.
          </p>
        </div>
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

        {success && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <Input
          label="Organization Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Organization"
          required
        />

        <Input
          label="Slug"
          type="text"
          value={org.slug}
          readOnly
          className="cursor-not-allowed bg-gray-50 text-secondary"
        />

        <Input
          label="Cancellation Hours"
          type="number"
          value={cancellationHours}
          onChange={(e) => setCancellationHours(Number(e.target.value))}
          placeholder="2"
          min={0}
          required
        />

        <Input
          label="Default Class Capacity"
          type="number"
          value={defaultCapacity}
          onChange={(e) => setDefaultCapacity(Number(e.target.value))}
          placeholder="20"
          min={1}
          required
        />

        <div className="pt-2">
          <Button type="submit" loading={loading}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
