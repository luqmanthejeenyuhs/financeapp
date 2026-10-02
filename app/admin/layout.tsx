import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import AdminSidebar from "@/components/admin/AdminSidebar";
import TickerTape from "@/components/marketing/TickerTape";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isStaff(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar role={session.user.role} />
      <div className="flex flex-1 flex-col">
        <TickerTape />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
