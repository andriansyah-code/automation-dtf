"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth, safeError } from "@/lib/auth-helpers";

const createTransactionSchema = z.object({
  rollId: z.string().min(1, "Roll wajib dipilih"),
  transactionDate: z.string().min(1, "Tanggal wajib diisi"),
  quantity: z.coerce.number().int().positive("Quantity harus lebih dari 0").optional(),
  numberOfDetails: z.coerce.number().int().min(0).optional(),
  printWidth: z.coerce.number().positive().optional().nullable(),
  printHeight: z.coerce.number().positive().optional().nullable(),
  labelHeight: z.coerce.number().positive().optional().nullable(),
  labelSizePresetId: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
  status: z.enum(["Processed", "Failed", "Completed"]).optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export async function createTransaction(data: CreateTransactionInput) {
  let user;
  try {
    user = await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  const parsed = createTransactionSchema.safeParse(data);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: errors };
  }

  try {
    const tx = await prisma.transaction.create({
      data: {
        rollId: parsed.data.rollId,
        transactionDate: new Date(parsed.data.transactionDate),
        quantity: parsed.data.quantity ?? 1,
        numberOfDetails: parsed.data.numberOfDetails ?? 0,
        printWidth: parsed.data.printWidth ?? null,
        printHeight: parsed.data.printHeight ?? null,
        labelHeight: parsed.data.labelHeight ?? null,
        labelSizePresetId: parsed.data.labelSizePresetId || null,
        path: parsed.data.path || null,
        status: parsed.data.status || "Processed",
        createdBy: user.id ?? null,
      },
    });

    revalidatePath("/transaksi");
    return { success: true, id: tx.id };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal membuat transaksi" };
  }
}

export async function updateTransaction(id: string, data: UpdateTransactionInput) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  const parsed = updateTransactionSchema.safeParse(data);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: errors };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.rollId !== undefined) updateData.rollId = parsed.data.rollId;
  if (parsed.data.transactionDate !== undefined)
    updateData.transactionDate = new Date(parsed.data.transactionDate);
  if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity;
  if (parsed.data.numberOfDetails !== undefined)
    updateData.numberOfDetails = parsed.data.numberOfDetails;
  if (parsed.data.printWidth !== undefined) updateData.printWidth = parsed.data.printWidth;
  if (parsed.data.printHeight !== undefined) updateData.printHeight = parsed.data.printHeight;
  if (parsed.data.labelHeight !== undefined) updateData.labelHeight = parsed.data.labelHeight;
  if (parsed.data.labelSizePresetId !== undefined)
    updateData.labelSizePresetId = parsed.data.labelSizePresetId || null;
  if (parsed.data.path !== undefined) updateData.path = parsed.data.path;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  try {
    await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/transaksi");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal mengupdate transaksi" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    await requireAuth();
  } catch (err) {
    return { error: safeError(err) };
  }

  try {
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/transaksi");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: safeError(err) };
    }
    return { error: "Gagal menghapus transaksi" };
  }
}
