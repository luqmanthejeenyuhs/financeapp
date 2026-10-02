import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import Sidebar from "@/components/dashboard/Sidebar";
import TickerTape from "@/components/marketing/TickerTape";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar isAdmin={isStaff(session.user.role)} />
      <div className="flex flex-1 flex-col">
        <TickerTape />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
