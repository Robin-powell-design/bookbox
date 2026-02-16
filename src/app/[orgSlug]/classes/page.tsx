import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WeekView } from "@/components/calendar/week-view";

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    notFound();
  }

  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const classInstances = await prisma.classInstance.findMany({
    where: {
      orgId: org.id,
      date: { gte: now, lte: twoWeeksOut },
      status: "SCHEDULED",
    },
    include: {
      template: {
        include: {
          instructor: { select: { id: true, name: true } },
          categories: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const bookingCounts = await prisma.booking.groupBy({
    by: ["classInstanceId"],
    where: {
      classInstanceId: { in: classInstances.map((c) => c.id) },
      status: { in: ["CONFIRMED", "WAITLISTED"] },
    },
    _count: true,
  });

  const classesWithAvailability = classInstances.map((ci) => {
    const booked =
      bookingCounts.find((b) => b.classInstanceId === ci.id)?._count ?? 0;
    return {
      id: ci.id,
      date: ci.date.toISOString(),
      time: ci.time,
      capacity: ci.capacity,
      bookedCount: booked,
      spotsRemaining: ci.capacity - booked,
      template: {
        id: ci.template.id,
        name: ci.template.name,
        duration: ci.template.duration,
        price: ci.template.price,
        instructor: ci.template.instructor,
        categories: ci.template.categories,
      },
    };
  });

  const categories = await prisma.category.findMany({
    where: { orgId: org.id },
    select: { id: true, name: true },
  });

  return (
    <WeekView
      classes={classesWithAvailability}
      categories={categories}
      orgSlug={orgSlug}
    />
  );
}
