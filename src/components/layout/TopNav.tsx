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
  Scissors,
  Lock,
  Key,
  ShieldCheck,
  Minimize2,
  FileSpreadsheet,
  Presentation,
  Menu,
  X
} from "lucide-react"

// Icon mapping helper for tools
export const toolIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  ocr: ScanText,
  "organize-pdf": Layers,
  "merge-pdf": Layers,
  "split-pdf": Scissors,
  "compress-pdf": Minimize2,
  "bates-pdf": Hash,
  "watermark-pdf": Type,
  "word-to-pdf": FileText,
  "excel-to-pdf": FileSpreadsheet,
  "ppt-to-pdf": Presentation,
  "pdf-to-jpg": Sparkles,
  "pdf-to-word": FileText,
  "protect-pdf": Lock,
  "unlock-pdf": Key,
  converter: Sparkles,
  archive: FolderArchive,
  batch: Layers,
  metadata: Info,
  checksum: Hash,
  text: Type,
}

export default function TopNav() {
  const pathname = usePathname()
  const { t, toolText, toggleLanguage, language } = useLanguage()
  const [activeDropdown, setActiveDropdown] = useState<"all" | "convert" | "security" | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown when route changes
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setActiveDropdown(null)
      setMobileMenuOpen(false)
    })
    return () => cancelAnimationFrame(handle)
  }, [pathname])

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#202220] bg-[#050605]/95 px-4 sm:px-6 py-2.5 backdrop-blur-md transition-colors" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand Logo & Sandboxed Privacy Badge */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-[#050605] font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              G
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                Gauss <span className="text-cyan-400 font-bold text-xs">PDF</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-400 -mt-0.5 tracking-tight hidden sm:block">
                Local-first Studio
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
            <ShieldCheck className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>100% Client Memory</span>
          </div>
        </div>

        {/* Desktop Header Links (iLovePDF Style Header Bar) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" ref={dropdownRef}>
          {/* Direct Quick Tools */}
          <Link
            href="/tools/merge-pdf"
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              pathname === "/tools/merge-pdf"
                ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-300 hover:text-white hover:bg-[#181918]"
            )}
          >
            Merge PDF
          </Link>

          <Link
            href="/tools/split-pdf"
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              pathname === "/tools/split-pdf"
                ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-300 hover:text-white hover:bg-[#181918]"
            )}
          >
            Split PDF
          </Link>

          <Link
            href="/tools/compress-pdf"
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              pathname === "/tools/compress-pdf"
                ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-300 hover:text-white hover:bg-[#181918]"
            )}
          >
            Compress PDF
          </Link>

          {/* Convert PDF Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "convert" ? null : "convert")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                activeDropdown === "convert"
                  ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-300 hover:text-white hover:bg-[#181918]"
              )}
            >
              <span>Convert PDF</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "convert" && "rotate-180")} />
            </button>

            {activeDropdown === "convert" && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-[#202220] bg-[#0d0e0d] p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 z-50">
                <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-400 px-2 py-1 border-b border-[#202220]">
                  Convert to & from PDF
                </div>
                <div className="mt-2 space-y-1">
                  {[
                    { id: "word-to-pdf", label: "Word to PDF", icon: FileText },
                    { id: "excel-to-pdf", label: "Excel to PDF", icon: FileSpreadsheet },
                    { id: "ppt-to-pdf", label: "PowerPoint to PDF", icon: Presentation },
                    { id: "pdf-to-jpg", label: "PDF to JPG", icon: Sparkles },
                    { id: "pdf-to-word", label: "PDF to Word", icon: FileText },
                    { id: "pdf-to-excel", label: "PDF to Excel", icon: FileSpreadsheet },
                  ].map((item) => (
                    <Link
                      key={item.id}
                      href={`/tools/${item.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-[#181918] hover:text-cyan-300 transition-colors"
                    >
                      <item.icon className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "security" ? null : "security")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border border-transparent",
                activeDropdown === "security"
                  ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/30"
                  : "text-zinc-300 hover:text-white hover:bg-[#181918]"
              )}
            >
              <span>Security</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "security" && "rotate-180")} />
            </button>

            {activeDropdown === "security" && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-[#202220] bg-[#0d0e0d] p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 z-50">
                <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-400 px-2 py-1 border-b border-[#202220]">
                  PDF Protection & Trust
                </div>
                <div className="mt-2 space-y-1">
                  {[
                    { id: "protect-pdf", label: "Protect PDF", icon: Lock },
                    { id: "unlock-pdf", label: "Unlock PDF", icon: Key },
                    { id: "sign-pdf", label: "Sign PDF", icon: Sparkles },
                    { id: "watermark-pdf", label: "Add Watermark", icon: Type },
                    { id: "redact-pdf", label: "Redact PDF", icon: ShieldCheck },
                  ].map((item) => (
                    <Link
                      key={item.id}
                      href={`/tools/${item.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-[#181918] hover:text-cyan-300 transition-colors"
                    >
                      <item.icon className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ALL PDF TOOLS Mega Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "all" ? null : "all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all border",
                activeDropdown === "all"
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/50"
                  : "bg-[#0d0e0d] text-zinc-200 border-[#202220] hover:border-cyan-500/40 hover:text-cyan-300"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
              <span>All PDF Tools</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "all" && "rotate-180")} />
            </button>

            {/* Mega Dropdown Menu */}
            {activeDropdown === "all" && (
              <div className="absolute right-0 mt-3 w-[660px] max-h-[80vh] overflow-y-auto rounded-2xl border border-[#202220] bg-[#0d0e0d] p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 z-50 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(categorizedTools).map(([category, tools]) => {
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 border-b border-[#202220] pb-1 flex items-center justify-between">
                          <span>{category}</span>
                          <span className="text-[9px] font-mono text-zinc-500">({tools.length})</span>
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
                                  "flex items-start gap-2.5 rounded-lg p-2 transition-all border border-transparent",
                                  isCurrent
                                    ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                                    : "text-zinc-300 hover:bg-[#181918] hover:text-white"
                                )}
                              >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#181918] text-cyan-400 border border-[#202220] mt-0.5">
                                  <Icon className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold tracking-wide">
                                    {toolText(tool.id, "name") || tool.name}
                                  </span>
                                  <span className="block truncate text-[10px] text-zinc-400">
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
        </nav>

        {/* Right side controls: Language, Settings, Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-[#202220] bg-[#0d0e0d] px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:border-cyan-500/40 hover:text-cyan-300"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>{language === "en" ? "TH" : "EN"}</span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "hidden sm:flex items-center gap-1.5 rounded-lg border border-[#202220] bg-[#0d0e0d] px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
              pathname === "/settings" ? "border-cyan-500/40 text-cyan-300 bg-cyan-950/20" : "text-zinc-300 hover:border-zinc-700 hover:text-white"
            )}
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span>{t("nav.settings")}</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[#202220] bg-[#0d0e0d] text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 rounded-xl border border-[#202220] bg-[#0d0e0d] p-4 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#202220]">
            <Link
              href="/tools/merge-pdf"
              className="flex items-center gap-2 rounded-lg bg-[#181918] p-2.5 text-xs font-bold text-cyan-300 border border-[#202220]"
            >
              <Layers className="h-4 w-4" />
              <span>Merge PDF</span>
            </Link>
            <Link
              href="/tools/split-pdf"
              className="flex items-center gap-2 rounded-lg bg-[#181918] p-2.5 text-xs font-bold text-cyan-300 border border-[#202220]"
            >
              <Scissors className="h-4 w-4" />
              <span>Split PDF</span>
            </Link>
            <Link
              href="/tools/compress-pdf"
              className="flex items-center gap-2 rounded-lg bg-[#181918] p-2.5 text-xs font-bold text-cyan-300 border border-[#202220]"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Compress PDF</span>
            </Link>
            <Link
              href="/tools"
              className="flex items-center gap-2 rounded-lg bg-[#181918] p-2.5 text-xs font-bold text-white border border-[#202220]"
            >
              <LayoutGrid className="h-4 w-4 text-cyan-400" />
              <span>All PDF Tools</span>
            </Link>
          </div>

          <div className="space-y-1">
            <Link
              href="/settings"
              className="flex items-center justify-between rounded-lg p-2 text-xs font-medium text-zinc-300 hover:bg-[#181918]"
            >
              <span>{t("nav.settings")}</span>
              <Settings className="h-4 w-4 text-zinc-500" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
