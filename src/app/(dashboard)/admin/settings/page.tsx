import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: context.organization.id },
    select: {
      id: true,
      name: true,
      slug: true,
      cancellationHours: true,
      defaultCapacity: true,
    },
  });

  if (!org) redirect("/login");

  return (
    <SettingsForm
      org={org}
    />
  );
}
