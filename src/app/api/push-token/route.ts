import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const platform = typeof body.platform === "string" ? body.platform : "unknown";

  if (!token) {
    return NextResponse.json({ error: "Jeton manquant." }, { status: 400 });
  }

  await prisma.pushToken.upsert({
    where: { token },
    update: { userId: user.id, platform },
    create: { token, platform, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
