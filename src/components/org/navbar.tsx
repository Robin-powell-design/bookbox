"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X, User, Dumbbell, Calendar, Package, MessageSquare, BookOpen, UserCircle } from "lucide-react";

interface NavbarProps {
  orgName: string;
  orgSlug: string;
  logo?: string | null;
}

export function Navbar({ orgName, orgSlug, logo }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();

  const publicLinks = [
    { href: `/${orgSlug}/classes`, label: "Classes", icon: Calendar },
    { href: `/${orgSlug}/packages`, label: "Packages", icon: Package },
  ];

  const memberLinks = [
    { href: `/${orgSlug}/bookings`, label: "My Bookings", icon: BookOpen },
    { href: `/${orgSlug}/messages`, label: "Messages", icon: MessageSquare },
    { href: `/${orgSlug}/profile`, label: "Profile", icon: UserCircle },
  ];

  const navLinks = session ? [...publicLinks, ...memberLinks] : publicLinks;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Org Name */}
        <Link
          href={`/${orgSlug}`}
          className="flex items-center gap-3"
        >
          {logo ? (
            <Image
              src={logo}
              alt={`${orgName} logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
              <Dumbbell className="h-5 w-5" />
            </span>
          )}
          <span className="font-heading text-xl font-bold text-primary">
            {orgName}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}

          {status === "loading" ? null : session ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
              <User className="h-4 w-4" />
              {session.user?.name || "Account"}
            </span>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              <User className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-secondary hover:bg-gray-100 hover:text-primary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-gray-100 hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {session ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
                <User className="h-4 w-4" />
                {session.user?.name || "Account"}
              </div>
            ) : (
              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
                onClick={() => setMobileOpen(false)}
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
