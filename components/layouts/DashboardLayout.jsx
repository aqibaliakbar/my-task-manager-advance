"use client";
import { useState } from "react";
import Header from "./Header";
import AppSidebar from "./Sidebar";
import { SidebarProvider } from "../ui/sidebar";

function DashboardLayout({ children }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col min-h-screen  bg-background ">
        <Header className="z-50 w-screen" />
        <div className="flex flex-1">
          <AppSidebar className="fixed inset-y-14 left-0 w-64 border-r" />
          <div className="flex-1  md:w-[calc(100vw-16rem)] pt-20">
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
