import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Calendar, Clock, User, Users, DollarSign } from "lucide-react";
import Link from "next/link";
import { BookButton } from "./book-button";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; instanceId: string }>;
}) {
  const { orgSlug, instanceId } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    notFound();
  }

  const classInstance = await prisma.classInstance.findUnique({
    where: { id: instanceId, orgId: org.id },
    include: {
      template: {
        include: {
          instructor: { select: { name: true } },
        },
      },
    },
  });

  if (!classInstance) {
    notFound();
  }

  const confirmedBookings = await prisma.booking.count({
    where: {
      classInstanceId: instanceId,
      status: "CONFIRMED",
    },
  });

  const spotsRemaining = classInstance.capacity - confirmedBookings;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/${orgSlug}/classes`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-primary"
      >
        &larr; Back to classes
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
        <h1 className="font-heading text-3xl font-bold text-primary">
          {classInstance.template.name}
        </h1>

        {classInstance.template.description && (
          <p className="mt-3 text-secondary leading-relaxed">
            {classInstance.template.description}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-secondary">
            <User className="h-5 w-5 shrink-0" />
            <span>{classInstance.template.instructor.name}</span>
          </div>

          <div className="flex items-center gap-3 text-secondary">
            <Calendar className="h-5 w-5 shrink-0" />
            <span>
              {format(new Date(classInstance.date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-secondary">
            <Clock className="h-5 w-5 shrink-0" />
            <span>
              {classInstance.time} ({classInstance.template.duration} min)
            </span>
          </div>

          <div className="flex items-center gap-3 text-secondary">
            <Users className="h-5 w-5 shrink-0" />
            <span>
              {spotsRemaining > 0
                ? `${spotsRemaining} spot${spotsRemaining === 1 ? "" : "s"} remaining`
                : "Class full"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-secondary">
            <DollarSign className="h-5 w-5 shrink-0" />
            <span>${(classInstance.template.price / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8">
          <BookButton
            instanceId={instanceId}
            orgSlug={orgSlug}
            spotsRemaining={spotsRemaining}
            price={classInstance.template.price}
          />
        </div>
      </div>
    </div>
  );
}
