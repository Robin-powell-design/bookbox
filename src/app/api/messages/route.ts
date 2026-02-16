import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "You must be signed in to view messages" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Get all messages for this user in this org
    const messages = await prisma.message.findMany({
      where: {
        orgId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group messages by the other user to build conversation list
    const conversationMap = new Map<
      string,
      {
        user: { id: string; name: string; avatar: string | null };
        lastMessage: {
          id: string;
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
        // Count unread messages from this other user
        const unreadCount = messages.filter(
          (m) =>
            m.senderId === otherUser.id &&
            m.receiverId === userId &&
            !m.read
        ).length;

        conversationMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: {
            id: message.id,
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

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Messages error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "You must be signed in to send a message" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id as string;
    const json = await request.json();

    const result = messageSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { receiverId, subject, body } = result.data;
    const orgId = json.orgId;

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    if (receiverId === userId) {
      return NextResponse.json(
        { error: "You cannot send a message to yourself" },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Verify org exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        orgId,
        subject,
        body,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
