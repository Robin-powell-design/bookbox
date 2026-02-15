import { NextRequest, NextResponse } from "next/server";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { classTemplateSchema } from "@/lib/validations";

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

  const url = new URL(req.url);
  const showAll = url.searchParams.get("all") === "true";

  const classTemplates = await prisma.classTemplate.findMany({
    where: {
      orgId,
      ...(showAll ? {} : { isActive: true }),
    },
    include: {
      instructor: {
        select: { id: true, name: true, email: true },
      },
      categories: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classTemplates);
}

export async function POST(
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

  try {
    const body = await req.json();
    const data = classTemplateSchema.parse(body);

    const { categoryIds, ...templateData } = data;

    const classTemplate = await prisma.classTemplate.create({
      data: {
        ...templateData,
        price: Math.round(data.price * 100),
        orgId,
        instructorId: context.user.id,
        ...(categoryIds && categoryIds.length > 0
          ? {
              categories: {
                connect: categoryIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        categories: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(classTemplate, { status: 201 });
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
