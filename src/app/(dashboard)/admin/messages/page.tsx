import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

export default async function AdminMessagesPage() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const messages = await prisma.message.findMany({
    where: { orgId },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Messages
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Recent messaging activity across your organization.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="rounded-lg bg-accent/10 p-4">
            <MessageSquare className="h-10 w-10 text-accent" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-primary">
            No messages yet
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Messages between members will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {messages.map((message) => (
              <li
                key={message.id}
                className="flex items-start gap-4 px-6 py-4 transition-colors duration-200 hover:bg-gray-50/50"
              >
                {/* Sender avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {message.sender.name.charAt(0).toUpperCase()}
                </div>

                {/* Message content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      {message.sender.name}
                    </span>
                    <span className="text-xs text-secondary">to</span>
                    <span className="text-sm font-medium text-primary">
                      {message.receiver.name}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium text-primary">
                    {message.subject}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-secondary">
                    {message.body.length > 120
                      ? `${message.body.slice(0, 120)}...`
                      : message.body}
                  </p>
                </div>

                {/* Meta: date + read status */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-secondary">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      message.read
                        ? "bg-gray-100 text-gray-500"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {message.read ? "Read" : "Unread"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
