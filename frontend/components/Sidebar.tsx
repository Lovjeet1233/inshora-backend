"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Mail,
  Share2,
  BarChart3,
  MessageCircle,
  Bot,
  Phone,
  X,
  Search,
  Users,
  FileText,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Lead Generation", href: "/lead-generation", icon: Search },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Mail },
  { name: "Prompts", href: "/prompts", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Social Media", href: "/social-media", icon: Share2 },
  { name: "WhatsApp Chat", href: "/whatsapp", icon: MessageCircle },
  { name: "AI Chatbot", href: "/chatbot", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out",
          // On mobile: show/hide based on open prop
          // On desktop (lg+): always visible
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Inshora CRM
              </span>
            </div>
            <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    // Only close sidebar on mobile (when it's an overlay)
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <p className="text-xs text-gray-500 text-center">
              © 2025 Inshora CRM
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
