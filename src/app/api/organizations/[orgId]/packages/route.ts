import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOrg } from "@/lib/get-user-org";
import { packageSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const context = await getUserOrg();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;

  if (context.organization.id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get("isActive");

  const where: { orgId: string; isActive?: boolean } = { orgId };
  if (isActive === "true") where.isActive = true;
  if (isActive === "false") where.isActive = false;

  const packages = await prisma.package.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(packages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const context = await getUserOrg();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;

  if (context.organization.id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = packageSchema.parse(body);

    const pkg = await prisma.package.create({
      data: {
        orgId,
        name: data.name,
        description: data.description,
        price: Math.round(data.price * 100),
        classCount: data.classCount,
        durationDays: data.durationDays,
        type: data.type,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
