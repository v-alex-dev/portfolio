#!/usr/bin/env node
/* Seed or update the admin user from .env (ADMIN_EMAIL, ADMIN_PASSWORD_HASH) */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  require("dotenv").config();
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH in .env");
    process.exit(1);
  }
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "admin" },
    create: { email, passwordHash, role: "admin" },
  });
  console.log("Admin user ensured:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
