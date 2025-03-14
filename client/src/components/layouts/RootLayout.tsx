import { Outlet } from "react-router-dom";
import Sidebar from "@/components/sidebar"; // Ensure the import path is correct

export default function RootLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet /> {/* This will render the child routes */}
      </main>
    </div>
  );
}