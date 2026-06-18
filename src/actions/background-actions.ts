"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth, safeError } from "@/lib/auth-helpers";

const createBackgroundSchema = z.object({
  name: z.string().min(1, "Nama background wajib diisi"),
  fontColor: z.string().min(1, "Warna font wajib dipilih"),
});

const updateBackgroundSchema = z.object({
  name: z.string().min(1, "Nama background wajib diisi").optional(),
  fontColor: z.string().min(1, "Warna font wajib dipilih").optional(),
});

export type CreateBackgroundInput = z.infer<typeof createBackgroundSchema>;
export type UpdateBackgroundInput = z.infer<typeof updateBackgroundSchema>;

export async function createBackground(data: CreateBackgroundInput) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  const parsed = createBackgroundSchema.safeParse(data);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: errors };
  }

  try {
    await prisma.materialBackground.create({
      data: {
        name: parsed.data.name,
        fontColor: parsed.data.fontColor,
      },
    });

    revalidatePath("/materials/background");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal membuat background" };
  }
}

export async function updateBackground(id: string, data: UpdateBackgroundInput) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  const parsed = updateBackgroundSchema.safeParse(data);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: errors };
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.fontColor !== undefined) updateData.fontColor = parsed.data.fontColor;

    await prisma.materialBackground.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/materials/background");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal mengupdate background" };
  }
}

export async function deleteBackground(id: string) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  try {
    await prisma.materialBackground.delete({ where: { id } });
    revalidatePath("/materials/background");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal menghapus background" };
  }
}
