'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/lib/i18n"
import { toolRegistry } from "@/lib/tools/registry"
import { cn } from "@/lib/utils"

export default function TopNav() {
  const pathname = usePathname()
  const { t, toolText, toggleLanguage } = useLanguage()

  return (
    <nav className="fixed left-0 right-0 top-4 z-50 px-3 sm:top-6 sm:px-6" aria-label="Primary navigation">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1.5 shadow-2xl backdrop-blur-2xl">
        <Link
          href="/"
          className={cn(
            "rounded-full px-4 py-2 text-[11px] font-black tracking-tight transition-colors",
            pathname === "/" ? "bg-white text-zinc-950" : "text-white/88 hover:bg-white/10 hover:text-white",
          )}
        >
          Gauss
        </Link>
        <div className="hidden min-w-0 grid-cols-9 gap-1 lg:grid">
          {toolRegistry.map((tool) => {
            const href = `/tools/${tool.id}`
            const isActive = pathname === href

            return (
              <Link
                key={tool.id}
                href={href}
                className={cn(
                  "rounded-full px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] transition-all",
                  isActive ? "bg-cyan-200 text-zinc-950" : "text-white/55 hover:bg-white/10 hover:text-white",
                )}
              >
                {toolText(tool.id, "category") || tool.category}
              </Link>
            )
          })}
        </div>
        <Link
          href="/tools"
          className={cn(
            "rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all lg:hidden",
            pathname === "/tools" ? "bg-cyan-200 text-zinc-950" : "text-white/55 hover:bg-white/10 hover:text-white",
          )}
        >
          {t("nav.tools")}
        </Link>
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55 transition-all hover:bg-white/10 hover:text-white"
        >
          {t("nav.language")}
        </button>
        <Link
          href="/settings"
          className={cn(
            "rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all",
            pathname === "/settings" ? "bg-amber-200 text-zinc-950" : "text-white/55 hover:bg-white/10 hover:text-white",
          )}
        >
          {t("nav.settings")}
        </Link>
      </div>
    </nav>
  )
}
