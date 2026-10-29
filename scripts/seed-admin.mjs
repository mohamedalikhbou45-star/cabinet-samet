import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis (voir .env.example).");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 12) {
  console.error("ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  process.exit(1);
}

async function main() {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", active: true, password: hashed },
    create: {
      name: "Administrateur",
      email: ADMIN_EMAIL,
      password: hashed,
      role: "ADMIN",
      active: true,
    },
  });

  console.log(`✓ Compte admin prêt : ${admin.email} (rôle ${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
