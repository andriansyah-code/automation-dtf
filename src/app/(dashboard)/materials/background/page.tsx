import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackgroundClient } from "./background-client";

export default async function BackgroundPage() {
  const session = await auth();
  const backgrounds = await prisma.materialBackground.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <BackgroundClient
      backgrounds={JSON.parse(JSON.stringify(backgrounds))}
      userRole={session?.user?.role || "operator"}
    />
  );
}
