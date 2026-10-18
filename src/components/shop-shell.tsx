import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

// 商城页面共用外壳，避免在每个页面重复 Header/Footer
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      {children}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        Mini Mall · 演示项目
      </footer>
    </div>
  );
}
