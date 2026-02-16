import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { DollarSign, TrendingUp } from "lucide-react";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function SuperAdminCommissionsPage() {
  const completedPayments = await prisma.payment.findMany({
    where: { status: "COMPLETED" },
    include: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = completedPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const totalCommission = totalRevenue * 0.05;

  // Commission by organization
  const orgMap = new Map<
    string,
    { name: string; totalPayments: number; paymentCount: number }
  >();
  for (const payment of completedPayments) {
    const existing = orgMap.get(payment.orgId);
    if (existing) {
      existing.totalPayments += payment.amount;
      existing.paymentCount += 1;
    } else {
      orgMap.set(payment.orgId, {
        name: payment.organization.name,
        totalPayments: payment.amount,
        paymentCount: 1,
      });
    }
  }
  const orgCommissions = Array.from(orgMap.entries())
    .map(([orgId, data]) => ({
      orgId,
      name: data.name,
      totalPayments: data.totalPayments,
      commission: data.totalPayments * 0.05,
      paymentCount: data.paymentCount,
    }))
    .sort((a, b) => b.totalPayments - a.totalPayments);

  // Monthly commission breakdown (last 12 months)
  const now = new Date();
  const monthlyCommissions: {
    month: string;
    revenue: number;
    commission: number;
  }[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthRevenue = completedPayments
      .filter((p) => p.createdAt >= monthStart && p.createdAt <= monthEnd)
      .reduce((sum, p) => sum + p.amount, 0);

    monthlyCommissions.push({
      month: format(monthDate, "MMM yyyy"),
      revenue: monthRevenue,
      commission: monthRevenue * 0.05,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-50 p-2.5">
          <DollarSign className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            Platform Commissions
          </h1>
          <p className="text-sm text-secondary">
            5% commission on all completed payments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary">Total Revenue</p>
          <p className="mt-2 font-heading text-2xl font-bold text-primary">
            {formatPrice(totalRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary">
            Total Commission Earned
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-600">
            {formatPrice(totalCommission)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary">
            Completed Payments
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-primary">
            {completedPayments.length}
          </p>
        </div>
      </div>

      {/* Commission by Organization */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Commission by Organization
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Payments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Commission (5%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orgCommissions.map((org) => (
                <tr
                  key={org.orgId}
                  className="transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 font-medium text-primary">
                    {org.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {org.paymentCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {formatPrice(org.totalPayments)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                    {formatPrice(org.commission)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {totalRevenue > 0
                      ? ((org.totalPayments / totalRevenue) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </td>
                </tr>
              ))}
              {orgCommissions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-secondary"
                  >
                    No completed payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Commission Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
          <TrendingUp className="h-5 w-5 text-secondary" />
          <h2 className="font-heading text-lg font-semibold text-primary">
            Monthly Commission Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyCommissions.map((m) => (
                <tr
                  key={m.month}
                  className="transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {m.month}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatPrice(m.revenue)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                    {formatPrice(m.commission)}
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
