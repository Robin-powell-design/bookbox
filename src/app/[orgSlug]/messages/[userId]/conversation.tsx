"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface MessageUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  orgId: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  sender: MessageUser;
  receiver: MessageUser;
}

interface ConversationProps {
  initialMessages: Message[];
  currentUserId: string;
  otherUser: MessageUser;
  orgId: string;
  orgSlug: string;
}

export function Conversation({
  initialMessages,
  currentUserId,
  otherUser,
  orgId,
  orgSlug,
}: ConversationProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/messages/${otherUser.id}?orgId=${orgId}`
        );
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [otherUser.id, orgId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();

    if (!body.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUser.id,
          subject: subject.trim() || "No subject",
          body: body.trim(),
          orgId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send message");
        return;
      }

      const newMessage: Message = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setSubject("");
      setBody("");
    } catch {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Link
          href={`/${orgSlug}/messages`}
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
          {otherUser.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="font-heading text-lg font-semibold text-primary">
          {otherUser.name}
        </h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-secondary">
              No messages yet. Send a message to start the conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isSent = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      isSent
                        ? "bg-accent text-white"
                        : "border border-gray-200 bg-white text-primary"
                    }`}
                  >
                    {message.subject && message.subject !== "No subject" && (
                      <p
                        className={`text-xs font-semibold ${
                          isSent ? "text-white/80" : "text-secondary"
                        }`}
                      >
                        {message.subject}
                      </p>
                    )}
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {message.body}
                    </p>
                    <p
                      className={`mt-2 text-xs ${
                        isSent ? "text-white/60" : "text-secondary"
                      }`}
                    >
                      {format(new Date(message.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 pt-4"
      >
        {error && (
          <p className="mb-2 text-sm text-red-500">{error}</p>
        )}
        <div className="mb-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-foreground placeholder-gray-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
