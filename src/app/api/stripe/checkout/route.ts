import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const PLATFORM_FEE_PERCENT = 5;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { classInstanceId, packageId } = body as {
      classInstanceId?: string;
      packageId?: string;
    };

    if (!classInstanceId && !packageId) {
      return NextResponse.json(
        { error: "Either classInstanceId or packageId is required" },
        { status: 400 }
      );
    }

    let amount: number;
    let orgSlug: string;
    let stripeAccountId: string;
    let productName: string;
    let metadata: Record<string, string>;

    if (classInstanceId) {
      const classInstance = await prisma.classInstance.findUnique({
        where: { id: classInstanceId },
        include: {
          template: true,
          organization: true,
        },
      });

      if (!classInstance) {
        return NextResponse.json(
          { error: "Class instance not found" },
          { status: 404 }
        );
      }

      if (!classInstance.organization.stripeAccountId) {
        return NextResponse.json(
          { error: "Organization has not connected Stripe" },
          { status: 400 }
        );
      }

      amount = classInstance.template.price;
      orgSlug = classInstance.organization.slug;
      stripeAccountId = classInstance.organization.stripeAccountId;
      productName = classInstance.template.name;
      metadata = {
        classInstanceId,
        userId: session.user.id,
        orgId: classInstance.organization.id,
      };
    } else {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        include: {
          organization: true,
        },
      });

      if (!pkg) {
        return NextResponse.json(
          { error: "Package not found" },
          { status: 404 }
        );
      }

      if (!pkg.organization.stripeAccountId) {
        return NextResponse.json(
          { error: "Organization has not connected Stripe" },
          { status: 400 }
        );
      }

      amount = pkg.price;
      orgSlug = pkg.organization.slug;
      stripeAccountId = pkg.organization.stripeAccountId;
      productName = pkg.name;
      metadata = {
        packageId: packageId!,
        userId: session.user.id,
        orgId: pkg.organization.id,
      };
    }

    const applicationFeeAmount = Math.round(
      (amount * PLATFORM_FEE_PERCENT) / 100
    );

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: productName,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          metadata,
        },
        metadata,
        success_url: `${process.env.NEXTAUTH_URL}/${orgSlug}?checkout=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/${orgSlug}?checkout=cancelled`,
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
