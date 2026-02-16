"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { ClassCard } from "./class-card";

interface ClassData {
  id: string;
  date: string;
  time: string;
  capacity: number;
  bookedCount: number;
  spotsRemaining: number;
  template: {
    id: string;
    name: string;
    duration: number;
    price: number;
    instructor: { id: string; name: string };
    categories: { id: string; name: string }[];
  };
}

interface WeekViewProps {
  classes: ClassData[];
  categories: { id: string; name: string }[];
  orgSlug: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} - ${weekEnd.toLocaleDateString("en-US", opts)}, ${weekEnd.getFullYear()}`;
}

export function WeekView({ classes, categories, orgSlug }: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentWeekStart = useMemo(() => {
    const ws = getWeekStart(today);
    ws.setDate(ws.getDate() + weekOffset * 7);
    return ws;
  }, [today, weekOffset]);

  // Filter by category
  const filteredClasses = useMemo(() => {
    if (categoryFilter === "all") return classes;
    return classes.filter((c) =>
      c.template.categories.some((cat) => cat.id === categoryFilter)
    );
  }, [classes, categoryFilter]);

  // Group by day of week within current week
  const dayColumns = useMemo(() => {
    const days: ClassData[][] = Array.from({ length: 7 }, () => []);

    filteredClasses.forEach((cls) => {
      const classDate = new Date(cls.date);
      classDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.round(
        (classDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff >= 0 && dayDiff < 7) {
        days[dayDiff].push(cls);
      }
    });

    // Sort each day by time
    days.forEach((day) => day.sort((a, b) => a.time.localeCompare(b.time)));

    return days;
  }, [filteredClasses, currentWeekStart]);

  // Generate day dates for headers
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2.5">
            <CalendarDays className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Classes
            </h1>
            <p className="text-sm text-secondary">
              {formatWeekRange(currentWeekStart)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o - 1)}
              className="rounded-lg p-2 text-secondary transition-colors hover:bg-gray-100 hover:text-primary"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-gray-100 hover:text-primary"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o + 1)}
              className="rounded-lg p-2 text-secondary transition-colors hover:bg-gray-100 hover:text-primary"
              aria-label="Next week"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Week Grid */}
      <div className="hidden md:grid md:grid-cols-7 md:gap-3">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();

          return (
            <div key={i} className="min-h-[200px]">
              {/* Day header */}
              <div
                className={`mb-2 rounded-lg px-3 py-2 text-center ${
                  isToday
                    ? "bg-accent/10 text-accent"
                    : "bg-gray-50 text-secondary"
                }`}
              >
                <div className="text-xs font-medium uppercase">
                  {DAY_NAMES[day.getDay()]}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? "text-accent" : "text-primary"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* Classes for this day */}
              <div className="space-y-2">
                {dayColumns[i].length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-gray-400">
                    No classes
                  </p>
                ) : (
                  dayColumns[i].map((cls) => (
                    <ClassCard
                      key={cls.id}
                      id={cls.id}
                      time={cls.time}
                      spotsRemaining={cls.spotsRemaining}
                      capacity={cls.capacity}
                      orgSlug={orgSlug}
                      template={cls.template}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Day List */}
      <div className="space-y-4 md:hidden">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          if (dayColumns[i].length === 0) return null;

          return (
            <div key={i}>
              <div
                className={`mb-2 rounded-lg px-3 py-2 ${
                  isToday ? "bg-accent/10" : "bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-accent" : "text-primary"
                  }`}
                >
                  {DAY_NAMES_FULL[day.getDay()]}, {formatDateShort(day)}
                </span>
                {isToday && (
                  <span className="ml-2 text-xs font-medium text-accent">
                    Today
                  </span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {dayColumns[i].map((cls) => (
                  <ClassCard
                    key={cls.id}
                    id={cls.id}
                    time={cls.time}
                    spotsRemaining={cls.spotsRemaining}
                    capacity={cls.capacity}
                    orgSlug={orgSlug}
                    template={cls.template}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* If no classes at all in the week */}
        {dayColumns.every((d) => d.length === 0) && (
          <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-secondary">
              No classes scheduled this week.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
