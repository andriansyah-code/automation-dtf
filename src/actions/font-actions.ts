"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth, safeError } from "@/lib/auth-helpers";

const createFontSchema = z.object({
  name: z.string().min(1, "Nama font wajib diisi"),
  fontFamily: z.string().optional().nullable(),
});

export type CreateFontInput = z.infer<typeof createFontSchema>;

export async function createFont(data: CreateFontInput) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  const parsed = createFontSchema.safeParse(data);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: errors };
  }

  try {
    await prisma.materialFont.create({
      data: {
        name: parsed.data.name,
        fontFamily: parsed.data.fontFamily || null,
      },
    });

    revalidatePath("/materials/font");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal membuat font" };
  }
}

export async function deleteFont(id: string) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  try {
    await prisma.materialFont.delete({ where: { id } });
    revalidatePath("/materials/font");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal menghapus font" };
  }
}
