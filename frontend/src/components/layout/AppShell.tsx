import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[16rem_1fr] h-screen overflow-hidden">
      <Sidebar />
      <main className="overflow-y-auto bg-[#FFFCF5]">
        {children}
      </main>
    </div>
  );
}
