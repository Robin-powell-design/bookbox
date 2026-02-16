"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CreditCard } from "lucide-react";
import Link from "next/link";

interface PurchaseButtonProps {
  packageId: string;
  price: number;
  name: string;
}

export function PurchaseButton({ packageId, price, name }: PurchaseButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/5"
      >
        Sign in to purchase
      </Link>
    );
  }

  async function handlePurchase() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start checkout");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CreditCard className="h-4 w-4" />
        {loading
          ? "Processing..."
          : `Purchase - $${(price / 100).toFixed(2)}`}
      </button>
      {error && <p className="mt-1 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
