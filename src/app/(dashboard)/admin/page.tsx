import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  DollarSign,
  Users,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
} from "lucide-react";

export default async function AdminDashboard() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalRevenueResult,
    totalMembers,
    totalBookings,
    activePackages,
    thisMonthRevenueResult,
    lastMonthRevenueResult,
    recentBookings,
    upcomingClasses,
    recentPayments,
  ] = await Promise.all([
    // Total Revenue (COMPLETED payments)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { orgId, status: "COMPLETED" },
    }),

    // Total Members
    prisma.membership.count({
      where: { orgId },
    }),

    // Total Bookings (CONFIRMED for classes in this org)
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        classInstance: { orgId },
      },
    }),

    // Active Packages (remainingClasses > 0 OR expiresAt in the future)
    prisma.userPackage.count({
      where: {
        package: { orgId },
        OR: [
          { remainingClasses: { gt: 0 } },
          { expiresAt: { gt: now } },
        ],
      },
    }),

    // This month's revenue
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        orgId,
        status: "COMPLETED",
        createdAt: { gte: thisMonthStart },
      },
    }),

    // Last month's revenue
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        orgId,
        status: "COMPLETED",
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),

    // Recent Bookings (last 10)
    prisma.booking.findMany({
      where: { classInstance: { orgId } },
      include: {
        user: { select: { name: true } },
        classInstance: {
          include: {
            template: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Upcoming Classes (next 7 days)
    prisma.classInstance.findMany({
      where: {
        orgId,
        date: { gte: now, lte: sevenDaysFromNow },
        status: "SCHEDULED",
      },
      include: {
        template: {
          include: { instructor: { select: { name: true } } },
        },
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
      orderBy: { date: "asc" },
      take: 10,
    }),

    // Recent Payments (last 5)
    prisma.payment.findMany({
      where: { orgId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.amount ?? 0;
  const thisMonthRevenue = thisMonthRevenueResult._sum.amount ?? 0;
  const lastMonthRevenue = lastMonthRevenueResult._sum.amount ?? 0;

  const revenueChange =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0
        ? 100
        : 0;

  const statCards = [
    {
      label: "Total Revenue",
      value: `$${(totalRevenue / 100).toFixed(2)}`,
      icon: DollarSign,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      label: "Total Members",
      value: totalMembers.toLocaleString(),
      icon: Users,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Total Bookings",
      value: totalBookings.toLocaleString(),
      icon: Calendar,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      borderColor: "border-violet-200",
    },
    {
      label: "Active Packages",
      value: activePackages.toLocaleString(),
      icon: Package,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
    },
  ];

  const bookingStatusColor: Record<string, string> = {
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    WAITLISTED: "bg-yellow-100 text-yellow-700",
  };

  const paymentStatusColor: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-700",
  };

  const paymentTypeLabel: Record<string, string> = {
    SINGLE_CLASS: "Class",
    PACKAGE: "Package",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Overview of {context.organization.name}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.borderColor} ${stat.bg} p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary">
                    {stat.label}
                  </p>
                  <p className="font-heading mt-1 text-2xl font-bold text-primary">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg ${stat.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue This Month vs Last Month */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-secondary" />
          <h2 className="font-heading text-lg font-semibold text-primary">
            Revenue This Month
          </h2>
        </div>
        <div className="mt-4 flex items-end gap-4">
          <p className="font-heading text-3xl font-bold text-primary">
            ${(thisMonthRevenue / 100).toFixed(2)}
          </p>
          <div className="mb-1 flex items-center gap-1">
            {revenueChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-sm font-semibold ${
                revenueChange >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(1)}%
            </span>
            <span className="text-sm text-secondary">vs last month</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-secondary">
          Last month: ${(lastMonthRevenue / 100).toFixed(2)}
        </p>
      </div>

      {/* Two-column layout: Recent Bookings + Upcoming Classes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            <h2 className="font-heading text-lg font-semibold text-primary">
              Recent Bookings
            </h2>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-secondary">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-secondary">
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 font-medium">Class</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-2.5 font-medium text-primary">
                        {booking.user.name}
                      </td>
                      <td className="py-2.5 text-secondary">
                        {booking.classInstance.template.name}
                      </td>
                      <td className="py-2.5 text-secondary">
                        {format(new Date(booking.classInstance.date), "MMM d")}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            bookingStatusColor[booking.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Classes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            <h2 className="font-heading text-lg font-semibold text-primary">
              Upcoming Classes (7 Days)
            </h2>
          </div>
          {upcomingClasses.length === 0 ? (
            <p className="text-sm text-secondary">No upcoming classes.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingClasses.map((cls) => (
                <li key={cls.id} className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-primary">
                        {cls.template.name}
                      </p>
                      <p className="mt-0.5 text-sm text-secondary">
                        {format(new Date(cls.date), "EEE, MMM d")} at {cls.time}
                      </p>
                      <p className="mt-0.5 text-xs text-secondary">
                        Instructor: {cls.template.instructor.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3.5 w-3.5 text-secondary" />
                      <span className="font-medium text-primary">
                        {cls._count.bookings}
                      </span>
                      <span className="text-secondary">/ {cls.capacity}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-secondary" />
          <h2 className="font-heading text-lg font-semibold text-primary">
            Recent Payments
          </h2>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-secondary">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-secondary">
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Member</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-2.5 font-semibold text-primary">
                      ${(payment.amount / 100).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-secondary">
                      {payment.user.name}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {paymentTypeLabel[payment.type] ?? payment.type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          paymentStatusColor[payment.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-secondary">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
