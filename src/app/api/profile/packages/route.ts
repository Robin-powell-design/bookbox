import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id as string;
    const now = new Date();

    const userPackages = await prisma.userPackage.findMany({
      where: {
        userId,
        OR: [
          {
            remainingClasses: { gt: 0 },
          },
          {
            package: { type: "MONTHLY" },
            expiresAt: { gt: now },
          },
        ],
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            classCount: true,
            organization: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { purchasedAt: "desc" },
    });

    const packages = userPackages.map((up) => ({
      id: up.id,
      packageName: up.package.name,
      packageDescription: up.package.description,
      packageType: up.package.type,
      totalClasses: up.package.classCount,
      remainingClasses: up.remainingClasses,
      expiresAt: up.expiresAt,
      purchasedAt: up.purchasedAt,
      organizationName: up.package.organization.name,
      organizationSlug: up.package.organization.slug,
    }));

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Packages fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
