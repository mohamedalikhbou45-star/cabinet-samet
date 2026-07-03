import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@cabinetsamet.fr";
const ADMIN_PASSWORD = "CHANGE_ME";

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
