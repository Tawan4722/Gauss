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
  LayoutGrid,
  Scissors
} from "lucide-react"

// Icon mapping helper for tools
export const toolIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  ocr: ScanText,
  "merge-pdf": Layers,
  "split-pdf": Scissors,
  "bates-pdf": Hash,
  "watermark-pdf": Type,
  "grayscale-pdf": FileText,
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
  "PDF Operations": "category.pdf",
  "Conversions": "category.conversions",
  "Security & Trust": "category.security",
  "AI Suite": "category.ai",
  "Productivity": "category.productivity",
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
    const handle = requestAnimationFrame(() => {
      setDropdownOpen(false)
    })
    return () => cancelAnimationFrame(handle)
  }, [pathname])

  const isToolActive = pathname.startsWith("/tools/")

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-900 bg-black/80 px-6 py-3 backdrop-blur-md animate-fade-in" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200",
              pathname === "/" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Gauss
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Unified Workspace Link */}
            <Link
              href="/tools"
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200",
                pathname === "/tools" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {t("nav.tools")}
            </Link>

            {/* Categorized Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200",
                  isToolActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span>Utilities</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", dropdownOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu Panel */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-4 w-[600px] rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(categorizedTools).map(([category, tools]) => {
                      const categoryLabel = t(categoryKeyMap[category]) || category
                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-2">
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
                                    "flex items-start gap-3 rounded-xl p-2 transition-all duration-150",
                                    isCurrent ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                                  )}
                                >
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block text-xs font-semibold">
                                      {toolText(tool.id, "name") || tool.name}
                                    </span>
                                    <span className="block truncate text-[10px] text-zinc-500 mt-0.5">
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
        <div className="flex items-center gap-4">
          {/* Mobile Tools Link */}
          <Link
            href="/tools"
            className={cn(
              "md:hidden text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-200",
              pathname === "/tools" ? "text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t("nav.tools")}
          </Link>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 transition-all hover:text-zinc-300"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{language === "en" ? "TH" : "EN"}</span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-200",
              pathname === "/settings" ? "text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("nav.settings")}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
