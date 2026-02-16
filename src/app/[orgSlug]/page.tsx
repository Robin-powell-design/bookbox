import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";

export default async function OrgLandingPage({
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

  const upcomingClasses = await prisma.classInstance.findMany({
    where: {
      orgId: org.id,
      date: { gte: new Date() },
      status: "SCHEDULED",
    },
    include: {
      template: {
        include: { instructor: { select: { name: true } } },
      },
    },
    orderBy: { date: "asc" },
    take: 6,
  });

  const bookingCounts = await prisma.booking.groupBy({
    by: ["classInstanceId"],
    where: {
      classInstanceId: { in: upcomingClasses.map((c) => c.id) },
      status: { in: ["CONFIRMED", "WAITLISTED"] },
    },
    _count: true,
  });

  const bookingCountMap = new Map(
    bookingCounts.map((b) => [b.classInstanceId, b._count])
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="py-12 text-center sm:py-16">
        <h1 className="font-heading text-4xl font-bold text-primary sm:text-5xl">
          {org.name}
        </h1>
        {org.description && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary">
            {org.description}
          </p>
        )}
        <div className="mt-8">
          <Link
            href={`/${orgSlug}/classes`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent/90"
          >
            <Calendar className="h-5 w-5" />
            Browse Classes
          </Link>
        </div>
      </section>

      {/* Upcoming Classes Section */}
      <section className="py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-primary">
            Upcoming Classes
          </h2>
          <Link
            href={`/${orgSlug}/classes`}
            className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            View all classes &rarr;
          </Link>
        </div>

        {upcomingClasses.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-secondary">
              No upcoming classes scheduled yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingClasses.map((classInstance) => {
              const booked = bookingCountMap.get(classInstance.id) ?? 0;
              const spotsRemaining = classInstance.capacity - booked;

              return (
                <div
                  key={classInstance.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <h3 className="font-heading text-lg font-semibold text-primary">
                    {classInstance.template.name}
                  </h3>
                  <p className="mt-1 text-sm text-secondary">
                    with {classInstance.template.instructor.name}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(classInstance.date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Clock className="h-4 w-4" />
                      <span>{classInstance.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Users className="h-4 w-4" />
                      <span>
                        {spotsRemaining > 0
                          ? `${spotsRemaining} spot${spotsRemaining === 1 ? "" : "s"} remaining`
                          : "Class full"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <DollarSign className="h-4 w-4" />
                      <span>${(classInstance.template.price / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      href={`/${orgSlug}/classes`}
                      className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        spotsRemaining > 0
                          ? "bg-accent text-white hover:bg-accent/90"
                          : "cursor-not-allowed bg-gray-100 text-gray-400"
                      }`}
                    >
                      {spotsRemaining > 0 ? "Book Now" : "Full"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
