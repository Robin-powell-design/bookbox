import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getUserOrg();

  if (!context) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN"].includes(context.membership.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar orgName={context.organization.name} />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}
