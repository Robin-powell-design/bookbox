import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { CancelButton } from "./cancel-button";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    WAITLISTED: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    notFound();
  }

  const bookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      classInstance: { orgId: org.id },
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
    orderBy: { classInstance: { date: "asc" } },
  });

  const now = new Date();

  const upcoming = bookings.filter(
    (b) => new Date(b.classInstance.date) >= now && b.status === "CONFIRMED"
  );

  const past = bookings.filter(
    (b) => new Date(b.classInstance.date) < now || b.status === "CANCELLED"
  );

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-primary">
        My Bookings
      </h1>

      {/* Upcoming Bookings */}
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-primary">
          Upcoming Bookings
        </h2>

        {upcoming.length === 0 ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-secondary">
              No upcoming bookings. Browse classes to book your next session!
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {upcoming.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-semibold text-primary">
                      {booking.classInstance.template.name}
                    </h3>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-1 text-sm text-secondary">
                    with {booking.classInstance.template.instructor.name}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(
                          new Date(booking.classInstance.date),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-secondary">
                      <Clock className="h-4 w-4" />
                      <span>{booking.classInstance.time}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 shrink-0">
                  <CancelButton bookingId={booking.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Bookings */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-primary">
          Past Bookings
        </h2>

        {past.length === 0 ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-secondary">No past bookings yet.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {past.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-semibold text-primary">
                      {booking.classInstance.template.name}
                    </h3>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-1 text-sm text-secondary">
                    with {booking.classInstance.template.instructor.name}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(
                          new Date(booking.classInstance.date),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-secondary">
                      <Clock className="h-4 w-4" />
                      <span>{booking.classInstance.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
