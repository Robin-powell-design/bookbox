"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DAYS_OF_WEEK = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
] as const;

export function NewClassForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      description: description || undefined,
      dayOfWeek: dayOfWeek === "" ? null : Number(dayOfWeek),
      time,
      duration: Number(duration),
      capacity: Number(capacity),
      price: Number(price),
      isRecurring,
    };

    try {
      const res = await fetch(`/api/organizations/${orgId}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.error)) {
          const messages = data.error
            .map((e: { message: string }) => e.message)
            .join(", ");
          setError(messages);
        } else {
          setError(
            typeof data.error === "string"
              ? data.error
              : "Failed to create class"
          );
        }
        setLoading(false);
        return;
      }

      router.push("/admin/classes");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Input
        label="Class name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Morning Yoga"
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-secondary">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of the class..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground placeholder-gray-400 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-secondary">
            Day of the week
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">One-off (no fixed day)</option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Input
          label="Duration (minutes)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="60"
          min={15}
          max={480}
          required
        />

        <Input
          label="Capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="20"
          min={1}
          max={100}
          required
        />

        <Input
          label="Price ($)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="25.00"
          min={0}
          step="0.01"
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isRecurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent/20"
        />
        <label htmlFor="isRecurring" className="text-sm font-medium text-secondary">
          This is a recurring class
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" loading={loading}>
          Create Class
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/classes")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
