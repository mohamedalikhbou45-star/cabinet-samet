import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  if (!session.user.twoFactorVerified) {
    redirect("/verify-2fa");
  }

  return (
    <AdminShell adminName={session.user.name ?? "Administrateur"}>
      {children}
    </AdminShell>
  );
}
