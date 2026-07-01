'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect, useMemo } from "react"
import { useLanguage } from "@/lib/i18n"
import { toolRegistry } from "@/lib/tools/registry"
import { cn } from "@/lib/utils"
import {
  Image,
  ScanText,
  FileText,
  FolderArchive,
  Hash,
  Info,
  Type,
  ChevronDown,
  Layers,
  Sparkles,
  Settings,
  Globe,
  LayoutGrid
} from "lucide-react"

// Icon mapping helper for tools
export const toolIconMap: Record<string, React.ComponentType<any>> = {
  image: Image,
  ocr: ScanText,
  pdf: FileText,
  text: Type,
  converter: Sparkles,
  archive: FolderArchive,
  batch: Layers,
  metadata: Info,
  checksum: Hash,
}

// Category translation keys mapping
export const categoryKeyMap: Record<string, string> = {
  "Media & Vision": "category.media",
  "Documents & Text": "category.docs",
  "File Operations": "category.files",
  "Data & Security": "category.security",
}

export default function TopNav() {
  const pathname = usePathname()
  const { t, toolText, toggleLanguage, language } = useLanguage()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Group tools by category
  const categorizedTools = useMemo(() => {
    const groups: Record<string, typeof toolRegistry> = {}
    toolRegistry.forEach((tool) => {
      const cat = tool.category
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(tool)
    })
    return groups
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false)
  }, [pathname])

  const isToolActive = pathname.startsWith("/tools/")

  return (
    <nav className="fixed left-0 right-0 top-4 z-50 px-4 sm:top-6 sm:px-8" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/[0.08] bg-black/45 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "relative rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300",
              pathname === "/" 
                ? "bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.25)]" 
                : "text-white/90 hover:bg-white/10 hover:text-white"
            )}
          >
            Gauss
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            {/* Unified Workspace Link */}
            <Link
              href="/tools"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-300",
                pathname === "/tools" 
                  ? "bg-cyan-200 text-zinc-950 shadow-[0_0_20px_rgba(165,243,252,0.25)]" 
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <LayoutGrid className="h-3 w-3" />
              {t("nav.tools")}
            </Link>

            {/* Categorized Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-300",
                  isToolActive 
                    ? "bg-cyan-900/40 text-cyan-200 border border-cyan-500/20" 
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span>Utilities</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", dropdownOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu Panel */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-3 w-[640px] rounded-3xl border border-white/10 bg-[#0c0e0c]/95 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(categorizedTools).map(([category, tools]) => {
                      const categoryLabel = t(categoryKeyMap[category]) || category
                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/50 px-2">
                            {categoryLabel}
                          </h4>
                          <div className="space-y-1">
                            {tools.map((tool) => {
                              const Icon = toolIconMap[tool.id] || Sparkles
                              const isCurrent = pathname === `/tools/${tool.id}`
                              return (
                                <Link
                                  key={tool.id}
                                  href={`/tools/${tool.id}`}
                                  className={cn(
                                    "flex items-start gap-3 rounded-2xl p-2.5 transition-all duration-200 hover:bg-white/[0.04]",
                                    isCurrent ? "bg-white/[0.06] border-l-2 border-cyan-300" : ""
                                  )}
                                >
                                  <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/70",
                                    isCurrent && "bg-cyan-500/10 text-cyan-300"
                                  )}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block text-xs font-semibold text-white/90 group-hover:text-cyan-200">
                                      {toolText(tool.id, "name") || tool.name}
                                    </span>
                                    <span className="block truncate text-[10px] text-white/40 mt-0.5">
                                      {toolText(tool.id, "description") || tool.description}
                                    </span>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls: Lang, Settings */}
        <div className="flex items-center gap-1">
          {/* Mobile Tools Link */}
          <Link
            href="/tools"
            className={cn(
              "md:hidden rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all",
              pathname === "/tools" ? "bg-cyan-200 text-zinc-950" : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
          >
            {t("nav.tools")}
          </Link>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            <Globe className="h-3 w-3" />
            <span>{language === "en" ? "TH" : "EN"}</span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all",
              pathname === "/settings" 
                ? "bg-amber-200 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.25)]" 
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
          >
            <Settings className="h-3 w-3 animate-[spin_8s_linear_infinite]" />
            <span className="hidden sm:inline">{t("nav.settings")}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
