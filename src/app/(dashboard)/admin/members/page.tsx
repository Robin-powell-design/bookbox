import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { format } from "date-fns";
import type { Role } from "@prisma/client";

const ROLE_BADGE: Record<Role, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  INSTRUCTOR: "bg-green-100 text-green-700",
  MEMBER: "bg-gray-100 text-gray-600",
};

export default async function AdminMembersPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const members = await prisma.membership.findMany({
    where: { orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-2.5">
          <Users className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            Members
          </h1>
          <p className="text-sm text-secondary">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="rounded-lg bg-accent/10 p-4">
            <Users className="h-10 w-10 text-accent" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-primary">
            No members yet
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Members will appear here once they join your organization.
          </p>
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
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{m.user.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {m.user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[m.role]}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {format(m.joinedAt, "MMM d, yyyy")}
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
