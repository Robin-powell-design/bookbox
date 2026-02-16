"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface BookButtonProps {
  instanceId: string;
  orgSlug: string;
  spotsRemaining: number;
  price: number;
}

export function BookButton({
  instanceId,
  orgSlug,
  spotsRemaining,
  price,
}: BookButtonProps) {
  const { data: session, status } = useSession();
  const [bookingState, setBookingState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (status === "loading") {
    return (
      <button
        disabled
        className="inline-flex w-full items-center justify-center rounded-lg bg-gray-100 px-6 py-3 text-base font-medium text-gray-400"
      >
        Loading...
      </button>
    );
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent/90"
      >
        Sign in to book
      </Link>
    );
  }

  if (spotsRemaining <= 0) {
    return (
      <button
        disabled
        className="inline-flex w-full items-center justify-center rounded-lg bg-gray-100 px-6 py-3 text-base font-medium text-gray-400 cursor-not-allowed"
      >
        Class Full
      </button>
    );
  }

  if (bookingState === "success") {
    return (
      <div className="w-full rounded-lg border border-green-200 bg-green-50 px-6 py-3 text-center">
        <p className="text-base font-medium text-green-700">Booked!</p>
        <p className="mt-1 text-sm text-green-600">
          Your spot has been reserved.
        </p>
      </div>
    );
  }

  async function handleBook() {
    setBookingState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classInstanceId: instanceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to book class");
      }

      setBookingState("success");
    } catch (err) {
      setBookingState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleBook}
        disabled={bookingState === "loading"}
        className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed"
      >
        {bookingState === "loading"
          ? "Booking..."
          : `Book Now - $${(price / 100).toFixed(2)}`}
      </button>
      {bookingState === "error" && errorMessage && (
        <p className="mt-2 text-center text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
