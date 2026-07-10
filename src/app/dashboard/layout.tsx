import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.twoFactorVerified) {
    redirect("/verify-2fa");
  }

  return (
    <DashboardShell userName={session.user.name ?? "Client"}>
      {children}
    </DashboardShell>
  );
}
