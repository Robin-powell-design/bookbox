import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      classInstance: {
        include: {
          organization: { select: { cancellationHours: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Booking is already cancelled" },
      { status: 400 }
    );
  }

  // Check cancellation policy
  const cancellationHours =
    booking.classInstance.organization.cancellationHours ?? 2;
  const classDate = new Date(booking.classInstance.date);
  const now = new Date();
  const hoursUntilClass =
    (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilClass < cancellationHours) {
    return NextResponse.json(
      { error: "Too late to cancel" },
      { status: 400 }
    );
  }

  // Cancel the booking
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  // If the user used a package, refund the class credit
  if (booking.paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: booking.paymentId },
      include: { userPackage: true },
    });

    if (payment?.userPackage && payment.userPackage.remainingClasses !== null) {
      await prisma.userPackage.update({
        where: { id: payment.userPackage.id },
        data: { remainingClasses: { increment: 1 } },
      });
    }
  }

  return NextResponse.json(updatedBooking);
}
