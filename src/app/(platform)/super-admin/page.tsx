import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  PENDING: "bg-yellow-50 text-yellow-700",
  REFUNDED: "bg-red-50 text-red-700",
  FAILED: "bg-gray-100 text-gray-500",
};

export default async function SuperAdminDashboard() {
  const [organizations, totalMembers, payments] = await Promise.all([
    prisma.organization.findMany({
      include: {
        _count: { select: { memberships: true } },
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
    prisma.payment.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, createdAt: true, orgId: true },
    }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const platformCommission = totalRevenue * 0.05;

  // Monthly revenue for last 6 months
  const now = new Date();
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthTotal = payments
      .filter((p) => p.createdAt >= monthStart && p.createdAt <= monthEnd)
      .reduce((sum, p) => sum + p.amount, 0);

    monthlyRevenue.push({
      month: format(monthDate, "MMM yyyy"),
      revenue: monthTotal,
    });
  }

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  // Recent payments (last 10 across all orgs)
  const recentPayments = await prisma.payment.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    },
  });

  const statCards = [
    {
      label: "Total Organizations",
      value: organizations.length.toString(),
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Members",
      value: totalMembers.toString(),
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Platform Commission (5%)",
      value: formatPrice(platformCommission),
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Platform Dashboard
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Overview of the entire BookBox platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-secondary">{stat.label}</p>
            </div>
            <p className="mt-3 font-heading text-2xl font-bold text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-primary">
          Monthly Revenue (Last 6 Months)
        </h2>
        <div className="mt-4 space-y-3">
          {monthlyRevenue.map((m) => (
            <div key={m.month} className="flex items-center gap-4">
              <span className="w-24 text-sm text-secondary">{m.month}</span>
              <div className="flex-1">
                <div className="h-6 rounded-full bg-gray-100">
                  <div
                    className="h-6 rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%`,
                    }}
                  />
                </div>
              </div>
              <span className="w-28 text-right text-sm font-medium text-primary">
                {formatPrice(m.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Organizations */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Organizations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Stripe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {organizations.map((org) => {
                const orgRevenue = org.payments.reduce(
                  (sum, p) => sum + p.amount,
                  0
                );
                return (
                  <tr
                    key={org.id}
                    className="transition-colors duration-200 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-primary">
                      {org.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-secondary">
                      {org.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {org._count.memberships}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      {formatPrice(orgRevenue)}
                    </td>
                    <td className="px-6 py-4">
                      {org.stripeAccountId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Not connected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Recent Payments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Commission (5%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 text-sm text-secondary">
                    {format(payment.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {payment.organization.name}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-primary">
                      {payment.user.name}
                    </p>
                    <p className="text-xs text-secondary">
                      {payment.user.email}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {formatPrice(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-600">
                    {formatPrice(payment.amount * 0.05)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[payment.status] ??
                        "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {payment.status}
                    </span>
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
