import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const { userId, orgId, classInstanceId, packageId } = metadata;

    if (!userId || !orgId) {
      console.error("Missing userId or orgId in session metadata");
      return NextResponse.json({ received: true });
    }

    const stripePaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    try {
      if (classInstanceId) {
        const payment = await prisma.payment.create({
          data: {
            userId,
            orgId,
            amount: session.amount_total ?? 0,
            type: "SINGLE_CLASS",
            status: "COMPLETED",
            stripePaymentId,
          },
        });

        await prisma.booking.upsert({
          where: {
            userId_classInstanceId: {
              userId,
              classInstanceId,
            },
          },
          update: {
            status: "CONFIRMED",
            paymentId: payment.id,
          },
          create: {
            userId,
            classInstanceId,
            status: "CONFIRMED",
            paymentId: payment.id,
          },
        });
      } else if (packageId) {
        const pkg = await prisma.package.findUnique({
          where: { id: packageId },
        });

        const payment = await prisma.payment.create({
          data: {
            userId,
            orgId,
            amount: session.amount_total ?? 0,
            type: "PACKAGE",
            status: "COMPLETED",
            stripePaymentId,
          },
        });

        const expiresAt =
          pkg?.durationDays != null
            ? new Date(
                Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000
              )
            : null;

        await prisma.userPackage.create({
          data: {
            userId,
            packageId,
            remainingClasses: pkg?.classCount ?? null,
            expiresAt,
            paymentId: payment.id,
          },
        });
      }
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Error processing webhook" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
