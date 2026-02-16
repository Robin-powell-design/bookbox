import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Conversation } from "./conversation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; userId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orgSlug, userId: otherUserId } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    notFound();
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true, avatar: true },
  });

  if (!otherUser) {
    notFound();
  }

  const currentUserId = session.user.id;

  // Fetch initial messages between the two users
  const messages = await prisma.message.findMany({
    where: {
      orgId: org.id,
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      receiver: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages from the other user as read
  await prisma.message.updateMany({
    where: {
      orgId: org.id,
      senderId: otherUserId,
      receiverId: currentUserId,
      read: false,
    },
    data: { read: true },
  });

  // Serialize dates for client component
  const serializedMessages = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <Conversation
      initialMessages={serializedMessages}
      currentUserId={currentUserId}
      otherUser={otherUser}
      orgId={org.id}
      orgSlug={orgSlug}
    />
  );
}
