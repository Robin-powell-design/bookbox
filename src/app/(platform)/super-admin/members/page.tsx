import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Users } from "lucide-react";

export default async function SuperAdminMembersPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          memberships: true,
          bookings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-emerald-50 p-2.5">
          <Users className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            All Members
          </h1>
          <p className="text-sm text-secondary">
            {users.length} users across all organizations
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Organizations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Total Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-primary">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {user._count.memberships}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {user._count.bookings}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {format(user.createdAt, "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
