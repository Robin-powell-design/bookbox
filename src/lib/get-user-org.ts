import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getUserOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "INSTRUCTOR"] },
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
  });

  if (!membership) return null;

  return {
    user: session.user,
    membership,
    organization: membership.organization,
  };
}
