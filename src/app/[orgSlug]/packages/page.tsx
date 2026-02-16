import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, Calendar, CreditCard } from "lucide-react";
import { PurchaseButton } from "./purchase-button";

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    notFound();
  }

  const packages = await prisma.package.findMany({
    where: {
      orgId: org.id,
      isActive: true,
    },
    orderBy: { price: "asc" },
  });

  return (
    <div>
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-primary">
          Packages
        </h1>
        <p className="mt-2 text-secondary">
          Save with class packages and memberships
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="mt-10 rounded-lg border border-gray-200 bg-white py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-secondary">
            No packages available at the moment. Check back soon!
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-heading text-lg font-semibold text-primary">
                  {pkg.name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    pkg.type === "BUNDLE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {pkg.type}
                </span>
              </div>

              {pkg.description && (
                <p className="mt-2 text-sm text-secondary">{pkg.description}</p>
              )}

              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-bold text-primary">
                    ${(pkg.price / 100).toFixed(2)}
                  </span>
                  {pkg.type === "MONTHLY" && (
                    <span className="text-sm text-secondary">/month</span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {pkg.classCount && (
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {pkg.classCount} class{pkg.classCount === 1 ? "" : "es"}{" "}
                      included
                    </span>
                  </div>
                )}
                {pkg.durationDays && (
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Valid for {pkg.durationDays} day
                      {pkg.durationDays === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6">
                <PurchaseButton
                  packageId={pkg.id}
                  price={pkg.price}
                  name={pkg.name}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
