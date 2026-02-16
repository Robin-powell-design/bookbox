import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { BrandingForm } from "./branding-form";

export default async function BrandingPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  return <BrandingForm orgId={context.organization.id} />;
}
