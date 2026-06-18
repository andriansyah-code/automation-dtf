import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  const [
    totalRolls,
    totalTransactions,
    totalFonts,
    totalBackgrounds,
    completedTransactions,
    recentRolls,
    recentTransactions,
  ] = await Promise.all([
    prisma.roll.count(),
    prisma.transaction.count(),
    prisma.materialFont.count(),
    prisma.materialBackground.count(),
    prisma.transaction.count({ where: { status: "Completed" } }),
    prisma.roll.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { roll: { select: { rollName: true } } },
    }),
  ]);

  return (
    <DashboardClient
      userName={session?.user?.name || "User"}
      userRole={session?.user?.role || "operator"}
      totalRolls={totalRolls}
      totalTransactions={totalTransactions}
      totalFonts={totalFonts}
      totalBackgrounds={totalBackgrounds}
      completedTransactions={completedTransactions}
      recentRolls={JSON.parse(JSON.stringify(recentRolls))}
      recentTransactions={JSON.parse(JSON.stringify(recentTransactions))}
    />
  );
}
