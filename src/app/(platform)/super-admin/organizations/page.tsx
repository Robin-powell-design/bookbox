import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Building2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function SuperAdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: { select: { memberships: true } },
      memberships: {
        where: { role: "OWNER" },
        include: { user: { select: { name: true, email: true } } },
        take: 1,
      },
      payments: {
        where: { status: "COMPLETED" },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrgs = organizations.length;
  const totalRevenue = organizations.reduce(
    (sum, org) => sum + org.payments.reduce((s, p) => s + p.amount, 0),
    0
  );
  const totalCommission = totalRevenue * 0.05;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2.5">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            All Organizations
          </h1>
          <p className="text-sm text-secondary">
            {totalOrgs} organizations / {formatPrice(totalRevenue)} total
            revenue / {formatPrice(totalCommission)} commission
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Commission (5%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Stripe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {organizations.map((org) => {
                const orgRevenue = org.payments.reduce(
                  (sum, p) => sum + p.amount,
                  0
                );
                const orgCommission = orgRevenue * 0.05;
                const owner = org.memberships[0]?.user;

                return (
                  <tr
                    key={org.id}
                    className="transition-colors duration-200 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary">{org.name}</p>
                      <p className="text-xs font-mono text-secondary">
                        {org.slug}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {owner ? (
                        <>
                          <p className="text-sm font-medium text-primary">
                            {owner.name}
                          </p>
                          <p className="text-xs text-secondary">
                            {owner.email}
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-secondary">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {org._count.memberships}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      {formatPrice(orgRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-600">
                      {formatPrice(orgCommission)}
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
                    <td className="px-6 py-4 text-sm text-secondary">
                      {format(org.createdAt, "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/${org.slug}`}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
