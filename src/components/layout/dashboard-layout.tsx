import { Sidebar } from "./sidebar";
import { Outlet } from "react-router-dom";
export default function DashboardLayout() {
  return (
    <div className="h-screen w-full flex overflow-hidden dark:bg-[#1F1F1F]">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}