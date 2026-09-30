import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/actions/auth";
import AcctNav from "@/components/AcctNav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/account");
  return (
    <div className="acct-layout">
      <nav className="sidenav card">
        <AcctNav logout={logoutAction} />
      </nav>
      <div>{children}</div>
    </div>
  );
}
