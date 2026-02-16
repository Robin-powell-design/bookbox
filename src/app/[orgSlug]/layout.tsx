import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ThemeInjector } from "@/components/org/theme-injector";
import { Navbar } from "@/components/org/navbar";
import { ReactNode } from "react";

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    notFound();
  }

  return (
    <>
      <ThemeInjector
        primaryColor={org.primaryColor}
        secondaryColor={org.secondaryColor}
        accentColor={org.accentColor}
      />
      <Navbar orgName={org.name} orgSlug={org.slug} logo={org.logo} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
