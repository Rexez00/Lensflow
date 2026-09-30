import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login?next=/admin");
  if (role !== "admin") redirect("/");
  return (
    <div className="acct-layout">
      <nav className="sidenav card"><AdminNav /></nav>
      <div>{children}</div>
    </div>
  );
}
