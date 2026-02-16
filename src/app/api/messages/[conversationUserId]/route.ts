import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationUserId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "You must be signed in to view messages" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id as string;
    const { conversationUserId } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Fetch messages between the two users in this org
    const messages = await prisma.message.findMany({
      where: {
        orgId,
        OR: [
          { senderId: userId, receiverId: conversationUserId },
          { senderId: conversationUserId, receiverId: userId },
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
        orgId,
        senderId: conversationUserId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Conversation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
