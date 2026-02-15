import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { Users, Calendar, CreditCard } from "lucide-react";

export default async function AdminDashboard() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const [memberCount, upcomingClasses, recentBookings, recentMembers] =
    await Promise.all([
      prisma.membership.count({
        where: { orgId, role: "MEMBER", status: "ACTIVE" },
      }),
      prisma.classInstance.count({
        where: {
          orgId,
          date: { gte: new Date() },
          status: "SCHEDULED",
        },
      }),
      prisma.booking.count({
        where: {
          classInstance: { orgId },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.membership.findMany({
        where: { orgId, role: "MEMBER" },
        include: { user: true },
        orderBy: { joinedAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "Active Members", value: memberCount, icon: Users },
    { label: "Upcoming Classes", value: upcomingClasses, icon: Calendar },
    { label: "Bookings (7d)", value: recentBookings, icon: CreditCard },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-secondary">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-primary">
          Recent Members
        </h2>
        {recentMembers.length === 0 ? (
          <p className="text-sm text-secondary">No members yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-primary">{m.user.name}</p>
                  <p className="text-sm text-secondary">{m.user.email}</p>
                </div>
                <span className="text-xs text-secondary">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
