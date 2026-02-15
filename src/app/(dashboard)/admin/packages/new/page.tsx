import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { PackageForm } from "./package-form";

export default async function NewPackagePage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  return <PackageForm orgId={context.organization.id} />;
}
