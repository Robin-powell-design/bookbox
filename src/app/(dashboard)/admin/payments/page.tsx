import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const TYPE_BADGE: Record<string, string> = {
  SINGLE_CLASS: "bg-blue-50 text-blue-700",
  PACKAGE: "bg-purple-50 text-purple-700",
};

const TYPE_LABEL: Record<string, string> = {
  SINGLE_CLASS: "Single Class",
  PACKAGE: "Package",
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  PENDING: "bg-yellow-50 text-yellow-700",
  REFUNDED: "bg-red-50 text-red-700",
  FAILED: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export default async function PaymentsPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const payments = await prisma.payment.findMany({
    where: { orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2.5">
            <CreditCard className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Payments
            </h1>
            <p className="text-sm text-secondary">
              Total revenue: {formatPrice(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-primary">
            No payments yet
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Payments will appear here once customers make purchases.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Stripe ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 text-sm text-secondary">
                    {format(payment.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">
                      {payment.user.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-secondary">
                      {payment.user.email}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {formatPrice(payment.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        TYPE_BADGE[payment.type] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {TYPE_LABEL[payment.type] ?? payment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[payment.status] ??
                        "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[payment.status] ?? payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-secondary">
                    {payment.stripePaymentId
                      ? payment.stripePaymentId.length > 20
                        ? `${payment.stripePaymentId.slice(0, 20)}...`
                        : payment.stripePaymentId
                      : "--"}
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
