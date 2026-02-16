import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";

const updateSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
  cancellationHours: z
    .number()
    .int()
    .min(0, "Cancellation hours must be 0 or greater"),
  defaultCapacity: z
    .number()
    .int()
    .min(1, "Default capacity must be at least 1"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const context = await getUserOrg();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (context.organization.id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["OWNER", "ADMIN"].includes(context.membership.role)) {
    return NextResponse.json(
      { error: "Only owners and admins can update settings" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const result = updateSettingsSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, cancellationHours, defaultCapacity } = result.data;

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name,
        cancellationHours,
        defaultCapacity,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        cancellationHours: true,
        defaultCapacity: true,
      },
    });

    return NextResponse.json(org);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
