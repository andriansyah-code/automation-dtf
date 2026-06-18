import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as bcrypt from "bcryptjs";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@tinemu.com" },
    update: {},
    create: {
      email: "admin@tinemu.com",
      password: adminPassword,
      name: "Admin Tinemu",
      role: "admin",
      isActive: true,
    },
  });
  console.log("  Admin user: admin@tinemu.com");

  const opPassword = await bcrypt.hash("operator123", 12);
  await prisma.user.upsert({
    where: { email: "operator@tinemu.com" },
    update: {},
    create: {
      email: "operator@tinemu.com",
      password: opPassword,
      name: "Operator Tinemu",
      role: "operator",
      isActive: true,
    },
  });
  console.log("  Operator user: operator@tinemu.com");

  const fonts = [
    "Times New Roman", "Arial", "Chococooky", "Comic Sans MS", "Poppins",
    "Ananda", "Bimbo", "BlackMango", "DearJoe", "HeyHey",
    "StayWriter", "Valentine",
  ];
  for (const name of fonts) {
    await prisma.materialFont.upsert({
      where: { name },
      update: {},
      create: { name, fontFamily: name },
    });
  }
  console.log("  " + fonts.length + " fonts seeded");

  const backgrounds = [
    { name: "OREN OVAL", fontColor: "#000000" },
    { name: "OV MERAH", fontColor: "#FFFFFF" },
    { name: "OV BIRU", fontColor: "#FFFFFF" },
    { name: "OV HIJAU", fontColor: "#FFFFFF" },
    { name: "OV HITAM", fontColor: "#FFFFFF" },
    { name: "OV UNGU", fontColor: "#FFFFFF" },
    { name: "OV KUNING", fontColor: "#000000" },
    { name: "OV PINK", fontColor: "#FFFFFF" },
    { name: "OV ABU", fontColor: "#FFFFFF" },
    { name: "OV COKLAT", fontColor: "#FFFFFF" },
    { name: "OV PUTIH", fontColor: "#000000" },
    { name: "OV SILVER", fontColor: "#000000" },
    { name: "OV EMAS", fontColor: "#000000" },
    { name: "SEGI OREN", fontColor: "#000000" },
    { name: "SEGI MERAH", fontColor: "#FFFFFF" },
    { name: "SEGI HITAM", fontColor: "#FFFFFF" },
    { name: "SEGI PUTIH", fontColor: "#000000" },
    { name: "SEGI ABU", fontColor: "#FFFFFF" },
    { name: "SEGI PINK", fontColor: "#FFFFFF" },
  ];
  for (const bg of backgrounds) {
    await prisma.materialBackground.upsert({
      where: { name: bg.name },
      update: { fontColor: bg.fontColor },
      create: { name: bg.name, fontColor: bg.fontColor },
    });
  }
  console.log("  " + backgrounds.length + " backgrounds seeded");

  // Seed label size presets (ukuran paten)
  const presets = [
    { name: "Standard",     printWidth: 5.0,  printHeight: 5.0,  labelHeight: 1.0,  isDefault: true  },
    { name: "Mini",         printWidth: 4.0,  printHeight: 4.0,  labelHeight: 0.8,  isDefault: false },
    { name: "Medium",       printWidth: 6.0,  printHeight: 6.0,  labelHeight: 1.2,  isDefault: false },
    { name: "Large",        printWidth: 7.0,  printHeight: 7.0,  labelHeight: 1.5,  isDefault: false },
    { name: "XL",           printWidth: 9.0,  printHeight: 9.0,  labelHeight: 2.0,  isDefault: false },
    { name: "Persegi Kecil",printWidth: 3.0,  printHeight: 3.0,  labelHeight: 1.0,  isDefault: false },
  ];
  for (const preset of presets) {
    await prisma.labelSizePreset.upsert({
      where: { name: preset.name },
      update: {},
      create: {
        name: preset.name,
        printWidth: preset.printWidth,
        printHeight: preset.printHeight,
        labelHeight: preset.labelHeight,
        isDefault: preset.isDefault,
      },
    });
  }
  console.log("  " + presets.length + " label size presets seeded");

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
