import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { NewClassForm } from "./new-class-form";

export default async function NewClassPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Create a New Class
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Set up a class template that can be scheduled for your members.
        </p>
      </div>

      <NewClassForm orgId={context.organization.id} />
    </div>
  );
}
