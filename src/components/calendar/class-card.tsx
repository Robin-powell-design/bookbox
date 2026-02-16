import Link from "next/link";
import { Clock, User, Users } from "lucide-react";

interface ClassCardProps {
  id: string;
  time: string;
  spotsRemaining: number;
  capacity: number;
  orgSlug: string;
  template: {
    name: string;
    duration: number;
    price: number;
    instructor: { name: string };
  };
}

export function ClassCard({
  id,
  time,
  spotsRemaining,
  capacity,
  orgSlug,
  template,
}: ClassCardProps) {
  const isFull = spotsRemaining <= 0;

  // Format time from 24h to 12h
  function formatTime(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  // Spots color
  function spotsColor() {
    if (spotsRemaining <= 0) return "text-gray-400";
    if (spotsRemaining <= 3) return "text-amber-600";
    return "text-green-600";
  }

  return (
    <Link
      href={`/${orgSlug}/classes/${id}`}
      className={`block rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm ${
        isFull ? "opacity-60" : ""
      }`}
    >
      <h4 className="font-heading text-sm font-semibold text-primary truncate">
        {template.name}
      </h4>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-secondary">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>
            {formatTime(time)} &middot; {template.duration} min
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-secondary">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{template.instructor.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-xs ${spotsColor()}`}>
            <Users className="h-3 w-3 flex-shrink-0" />
            <span>
              {isFull
                ? "Full"
                : `${spotsRemaining}/${capacity} spots`}
            </span>
          </div>
          <span className="text-xs font-medium text-primary">
            ${(template.price / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {isFull && (
        <span className="mt-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          Full
        </span>
      )}
    </Link>
  );
}
