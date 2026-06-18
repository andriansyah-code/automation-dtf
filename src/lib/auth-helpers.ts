import "server-only";

import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user as { id: string; role: string; name: string; email: string };
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export function safeError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return err.message;
    }
    if (err.message.includes("Unique constraint")) {
      return "Data sudah ada";
    }
    if (err.message.includes("Foreign key")) {
      return "Data masih digunakan oleh data lain";
    }
  }
  return "Terjadi kesalahan, coba lagi";
}
