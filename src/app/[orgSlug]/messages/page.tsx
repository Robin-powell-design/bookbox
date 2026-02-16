import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function MessagesPage({
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

  const userId = session.user.id;

  // Get all messages for this user in this org
  const messages = await prisma.message.findMany({
    where: {
      orgId: org.id,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      receiver: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by the other user to build conversation list
  const conversationMap = new Map<
    string,
    {
      user: { id: string; name: string; avatar: string | null };
      lastMessage: {
        subject: string;
        body: string;
        createdAt: Date;
        senderId: string;
      };
      unreadCount: number;
    }
  >();

  for (const message of messages) {
    const otherUser =
      message.senderId === userId ? message.receiver : message.sender;

    if (!conversationMap.has(otherUser.id)) {
      const unreadCount = messages.filter(
        (m) =>
          m.senderId === otherUser.id &&
          m.receiverId === userId &&
          !m.read
      ).length;

      conversationMap.set(otherUser.id, {
        user: otherUser,
        lastMessage: {
          subject: message.subject,
          body: message.body,
          createdAt: message.createdAt,
          senderId: message.senderId,
        },
        unreadCount,
      });
    }
  }

  const conversations = Array.from(conversationMap.values());

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-primary">
        Messages
      </h1>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-secondary">
            No messages yet. Start a conversation!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.user.id}
              href={`/${orgSlug}/messages/${conversation.user.id}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {conversation.user.name.charAt(0).toUpperCase()}
              </div>

              {/* Conversation info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-sm font-semibold text-primary truncate">
                    {conversation.user.name}
                  </h3>
                  <span className="shrink-0 text-xs text-secondary">
                    {formatDistanceToNow(
                      new Date(conversation.lastMessage.createdAt),
                      { addSuffix: true }
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-secondary truncate">
                  {conversation.lastMessage.subject}
                </p>
                <p className="mt-0.5 text-xs text-secondary truncate">
                  {conversation.lastMessage.senderId === userId
                    ? "You: "
                    : ""}
                  {conversation.lastMessage.body}
                </p>
              </div>

              {/* Unread badge */}
              {conversation.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                  {conversation.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
