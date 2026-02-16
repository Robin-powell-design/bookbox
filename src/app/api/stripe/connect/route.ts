import { NextRequest, NextResponse } from "next/server";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const context = await getUserOrg();

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.membership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the organization owner can connect Stripe" },
        { status: 403 }
      );
    }

    const { organization } = context;
    let stripeAccountId = organization.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        metadata: {
          orgId: organization.id,
        },
      });

      stripeAccountId = account.id;

      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeAccountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/admin`,
      return_url: `${process.env.NEXTAUTH_URL}/admin`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect link" },
      { status: 500 }
    );
  }
}
