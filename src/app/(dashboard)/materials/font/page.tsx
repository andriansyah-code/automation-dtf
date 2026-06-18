import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FontClient } from "./font-client";

export default async function FontPage() {
  const session = await auth();
  const fonts = await prisma.materialFont.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <FontClient
      fonts={JSON.parse(JSON.stringify(fonts))}
      userRole={session?.user?.role || "operator"}
    />
  );
}
