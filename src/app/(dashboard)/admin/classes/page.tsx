import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminClassesPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const classTemplates = await prisma.classTemplate.findMany({
    where: { orgId },
    include: {
      instructor: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2.5">
            <Calendar className="h-6 w-6 text-accent" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            Classes
          </h1>
        </div>
        <Link href="/admin/classes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </Link>
      </div>

      {classTemplates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-primary">
            No classes yet
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Create your first class template to start scheduling.
          </p>
          <Link href="/admin/classes/new" className="mt-6 inline-block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Day / Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classTemplates.map((ct) => (
                <tr key={ct.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{ct.name}</p>
                    {ct.isRecurring && (
                      <span className="text-xs text-secondary">Recurring</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {ct.instructor.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {ct.dayOfWeek !== null
                      ? DAY_NAMES[ct.dayOfWeek]
                      : "One-off"}{" "}
                    @ {ct.time}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {ct.duration} min
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {ct.capacity}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatPrice(ct.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ct.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ct.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
