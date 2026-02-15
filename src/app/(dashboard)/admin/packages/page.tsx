import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PackagesPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const packages = await prisma.package.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-primary">
          Packages
        </h1>
        <Link href="/admin/packages/new">
          <Button>Add Package</Button>
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="rounded-lg bg-accent/10 p-4">
            <Package className="h-10 w-10 text-accent" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-primary">
            No packages yet
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Create your first package to get started.
          </p>
          <Link href="/admin/packages/new" className="mt-6">
            <Button>Add Package</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-secondary">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-secondary">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-secondary">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-secondary">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent/10 p-2">
                        <Package className="h-4 w-4 text-accent" />
                      </div>
                      <span className="font-medium text-primary">
                        {pkg.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pkg.type === "BUNDLE"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {pkg.type === "BUNDLE" ? "Bundle" : "Monthly"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-primary">
                    ${(pkg.price / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {pkg.type === "BUNDLE" && pkg.classCount !== null
                      ? `${pkg.classCount} classes`
                      : null}
                    {pkg.type === "MONTHLY" && pkg.durationDays !== null
                      ? `${pkg.durationDays} days`
                      : null}
                    {pkg.type === "BUNDLE" && pkg.classCount === null
                      ? "--"
                      : null}
                    {pkg.type === "MONTHLY" && pkg.durationDays === null
                      ? "--"
                      : null}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pkg.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pkg.isActive ? "Active" : "Inactive"}
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
