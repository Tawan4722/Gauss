'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect, useMemo } from "react"
import { useLanguage } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
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
  X,
  Sun,
  Moon
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
  const { theme, toggleTheme } = useTheme()
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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 px-4 sm:px-6 py-2.5 backdrop-blur-md transition-colors duration-200" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand Logo & Sandboxed Privacy Badge */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              G
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                Gauss <span className="text-primary font-bold text-xs">PDF</span>
              </span>
              <span className="text-[9px] font-mono text-muted-foreground -mt-0.5 tracking-tight hidden sm:block">
                Local-first Studio
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
            <span>100% Client Memory</span>
          </div>
        </div>

        {/* Desktop Header Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" ref={dropdownRef}>
          {/* Direct Quick Tools */}
          <Link
            href="/tools/merge-pdf"
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              pathname === "/tools/merge-pdf"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-foreground/80 hover:text-foreground hover:bg-muted"
            )}
          >
            Merge PDF
          </Link>

          <Link
            href="/tools/split-pdf"
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              pathname === "/tools/split-pdf"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-foreground/80 hover:text-foreground hover:bg-muted"
            )}
          >
            Split PDF
          </Link>

          <Link
            href="/tools/compress-pdf"
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              pathname === "/tools/compress-pdf"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-foreground/80 hover:text-foreground hover:bg-muted"
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
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
              )}
            >
              <span>Convert PDF</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "convert" && "rotate-180")} />
            </button>

            {activeDropdown === "convert" && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 z-50">
                <div className="text-[9px] font-bold uppercase tracking-widest text-primary px-2 py-1 border-b border-border">
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
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
                    >
                      <item.icon className="h-3.5 w-3.5 text-primary" />
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
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
              )}
            >
              <span>Security</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "security" && "rotate-180")} />
            </button>

            {activeDropdown === "security" && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 z-50">
                <div className="text-[9px] font-bold uppercase tracking-widest text-primary px-2 py-1 border-b border-border">
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
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
                    >
                      <item.icon className="h-3.5 w-3.5 text-primary" />
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
                  ? "bg-primary/10 text-primary border-primary/50"
                  : "bg-card text-foreground border-border hover:border-primary/40 hover:text-primary"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              <span>All PDF Tools</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "all" && "rotate-180")} />
            </button>

            {/* Mega Dropdown Menu */}
            {activeDropdown === "all" && (
              <div className="absolute right-0 mt-3 w-[660px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 z-50 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(categorizedTools).map(([category, tools]) => {
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b border-border pb-1 flex items-center justify-between">
                          <span>{category}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">({tools.length})</span>
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
                                    ? "bg-primary/10 border-primary/40 text-primary"
                                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-primary border border-border mt-0.5">
                                  <Icon className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold tracking-wide">
                                    {toolText(tool.id, "name") || tool.name}
                                  </span>
                                  <span className="block truncate text-[10px] text-muted-foreground">
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

        {/* Right side controls: Theme Toggle, Language, Settings, Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-primary/40 hover:text-primary"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-sky-600" />
            )}
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-primary/40 hover:text-primary"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{language === "en" ? "TH" : "EN"}</span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
              pathname === "/settings" ? "border-primary/40 text-primary bg-primary/10" : "text-foreground/80 hover:border-border hover:text-foreground"
            )}
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t("nav.settings")}</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 rounded-xl border border-border bg-card p-4 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border">
            <Link
              href="/tools/merge-pdf"
              className="flex items-center gap-2 rounded-lg bg-muted p-2.5 text-xs font-bold text-primary border border-border"
            >
              <Layers className="h-4 w-4" />
              <span>Merge PDF</span>
            </Link>
            <Link
              href="/tools/split-pdf"
              className="flex items-center gap-2 rounded-lg bg-muted p-2.5 text-xs font-bold text-primary border border-border"
            >
              <Scissors className="h-4 w-4" />
              <span>Split PDF</span>
            </Link>
            <Link
              href="/tools/compress-pdf"
              className="flex items-center gap-2 rounded-lg bg-muted p-2.5 text-xs font-bold text-primary border border-border"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Compress PDF</span>
            </Link>
            <Link
              href="/tools"
              className="flex items-center gap-2 rounded-lg bg-muted p-2.5 text-xs font-bold text-foreground border border-border"
            >
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span>All PDF Tools</span>
            </Link>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between rounded-lg p-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
            </button>
            <Link
              href="/settings"
              className="flex items-center justify-between rounded-lg p-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <span>{t("nav.settings")}</span>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
