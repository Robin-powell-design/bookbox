import { NextRequest, NextResponse } from "next/server";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export async function GET(
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

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      logo: true,
    },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(org);
}

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
      { error: "Only owners and admins can update branding" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updates: Record<string, string | null> = {};

    if (body.primaryColor !== undefined) {
      if (!HEX_COLOR_REGEX.test(body.primaryColor)) {
        return NextResponse.json(
          { error: "Invalid primary color format. Use hex (e.g. #0F172A)" },
          { status: 400 }
        );
      }
      updates.primaryColor = body.primaryColor;
    }

    if (body.secondaryColor !== undefined) {
      if (!HEX_COLOR_REGEX.test(body.secondaryColor)) {
        return NextResponse.json(
          { error: "Invalid secondary color format. Use hex (e.g. #334155)" },
          { status: 400 }
        );
      }
      updates.secondaryColor = body.secondaryColor;
    }

    if (body.accentColor !== undefined) {
      if (!HEX_COLOR_REGEX.test(body.accentColor)) {
        return NextResponse.json(
          { error: "Invalid accent color format. Use hex (e.g. #0369A1)" },
          { status: 400 }
        );
      }
      updates.accentColor = body.accentColor;
    }

    if (body.logo !== undefined) {
      if (body.logo !== null && body.logo !== "" && typeof body.logo !== "string") {
        return NextResponse.json(
          { error: "Logo must be a URL string or null" },
          { status: 400 }
        );
      }
      updates.logo = body.logo || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: updates,
      select: {
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logo: true,
      },
    });

    return NextResponse.json(org);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
