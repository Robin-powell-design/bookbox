import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "You must be signed in to book a class" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();
    const { classInstanceId } = body;

    if (!classInstanceId || typeof classInstanceId !== "string") {
      return NextResponse.json(
        { error: "classInstanceId is required" },
        { status: 400 }
      );
    }

    // Fetch the class instance with its template
    const classInstance = await prisma.classInstance.findUnique({
      where: { id: classInstanceId },
      include: {
        template: true,
      },
    });

    if (!classInstance) {
      return NextResponse.json(
        { error: "Class instance not found" },
        { status: 404 }
      );
    }

    // Check that the class is scheduled
    if (classInstance.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "This class is no longer available for booking" },
        { status: 400 }
      );
    }

    // Check that the class date is in the future
    if (classInstance.date < new Date()) {
      return NextResponse.json(
        { error: "Cannot book a class that has already occurred" },
        { status: 400 }
      );
    }

    // Check capacity
    const confirmedBookings = await prisma.booking.count({
      where: {
        classInstanceId,
        status: "CONFIRMED",
      },
    });

    if (confirmedBookings >= classInstance.capacity) {
      return NextResponse.json(
        { error: "Class is full" },
        { status: 400 }
      );
    }

    // Check for existing booking (prevent double-booking)
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_classInstanceId: {
          userId,
          classInstanceId,
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You have already booked this class" },
        { status: 400 }
      );
    }

    // Check for a valid user package
    const now = new Date();
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        userId,
        package: {
          orgId: classInstance.orgId,
        },
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
        package: true,
      },
    });

    if (userPackage) {
      // Use the package: decrement remaining classes and create booking
      const [booking] = await prisma.$transaction([
        prisma.booking.create({
          data: {
            userId,
            classInstanceId,
            status: "CONFIRMED",
          },
          include: {
            classInstance: {
              include: {
                template: {
                  include: {
                    instructor: { select: { name: true } },
                  },
                },
              },
            },
          },
        }),
        ...(userPackage.remainingClasses !== null && userPackage.remainingClasses > 0
          ? [
              prisma.userPackage.update({
                where: { id: userPackage.id },
                data: {
                  remainingClasses: { decrement: 1 },
                },
              }),
            ]
          : []),
      ]);

      return NextResponse.json(booking, { status: 201 });
    }

    // No package found: create booking anyway (payment handled later via Stripe)
    const booking = await prisma.booking.create({
      data: {
        userId,
        classInstanceId,
        status: "CONFIRMED",
      },
      include: {
        classInstance: {
          include: {
            template: {
              include: {
                instructor: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
