import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/super-admin/members", label: "Members", icon: Users },
  { href: "/super-admin/commissions", label: "Commissions", icon: DollarSign },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== "robinpowell24@gmail.com") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="flex items-center gap-3 border-b border-gray-700 px-6 py-5">
          <div className="rounded-lg bg-indigo-600 p-2">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold">BookBox</h1>
            <p className="text-xs text-gray-400">Platform Admin</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 px-6 py-4">
          <p className="text-xs text-gray-500">Logged in as</p>
          <p className="mt-0.5 truncate text-sm text-gray-300">
            {session.user.email}
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {children}
      </main>
    </div>
  );
}
