'use client'

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Search, Star, ShieldCheck, Zap, Layers, Sparkles, FileText, Lock, Key, 
  Scissors, Hash, Type, FileSpreadsheet, Presentation, Globe, ScanText, 
  RotateCw, Crop, Minimize2, Wrench, FileCode, Camera, CheckSquare, Paintbrush, 
  GitCompare, Bot, ArrowRight, X
} from "lucide-react"
import { toolRegistry } from "@/lib/tools/registry"
import { useLanguage } from "@/lib/i18n"
import { cn } from "@/lib/utils"

// Icon mapping helper for tools
const toolIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  editor: FileText,
  "organize-pdf": Layers,
  "merge-pdf": Layers,
  "split-pdf": Scissors,
  "rotate-pdf": RotateCw,
  "crop-pdf": Crop,
  "compress-pdf": Minimize2,
  "repair-pdf": Wrench,
  "ocr-pdf": ScanText,
  "bates-pdf": Hash,
  "watermark-pdf": Type,
  "word-to-pdf": FileText,
  "excel-to-pdf": FileSpreadsheet,
  "ppt-to-pdf": Presentation,
  "html-to-pdf": FileCode,
  "scan-to-pdf": Camera,
  "pdf-to-jpg": Sparkles,
  "pdf-to-word": FileText,
  "pdf-to-ppt": Presentation,
  "pdf-to-excel": FileSpreadsheet,
  "pdf-to-pdfa": ShieldCheck,
  "protect-pdf": Lock,
  "unlock-pdf": Key,
  "sign-pdf": Paintbrush,
  "redact-pdf": CheckSquare,
  "compare-pdf": GitCompare,
  "ai-summarizer": Bot,
  "translate-pdf": Globe,
}

// Category badge color map
const categoryColorMap: Record<string, { border: string; bg: string; text: string }> = {
  "PDF Operations": { border: "border-cyan-500/30", bg: "bg-cyan-950/20", text: "text-cyan-400" },
  "Conversions": { border: "border-amber-500/30", bg: "bg-amber-950/20", text: "text-amber-400" },
  "Security & Trust": { border: "border-emerald-500/30", bg: "bg-emerald-950/20", text: "text-emerald-400" },
  "Documents & Text": { border: "border-blue-500/30", bg: "bg-blue-950/20", text: "text-blue-400" },
  "AI Suite": { border: "border-purple-500/30", bg: "bg-purple-950/20", text: "text-purple-400" },
}

export default function Home() {
  const { toolText } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem("gauss-favorites")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem("gauss-favorites", JSON.stringify(next))
  }

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(toolRegistry.map(t => t.category)))
    return ["All", "Favorites", ...cats]
  }, [])

  // Filter tools by search and category
  const filteredTools = useMemo(() => {
    return toolRegistry.filter(tool => {
      const matchesSearch = 
        searchQuery === "" || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (selectedCategory === "All") return true
      if (selectedCategory === "Favorites") return favorites.includes(tool.id)
      return tool.category === selectedCategory
    })
  }, [searchQuery, selectedCategory, favorites])

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 pt-20 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl text-center pt-8 pb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary mb-6">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>100% Client-Side Sandbox • Zero Server Transfers</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
          Every tool you need to work with <span className="text-primary">PDFs & Documents</span> in one place
        </h1>

        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Gauss Document Studio provides 27+ desktop-grade tools to merge, split, compress, edit, convert, stamp, sign, and OCR documents entirely inside your browser memory.
        </p>

        {/* Search Bar */}
        <div className="mt-8 mx-auto max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PDF tools (e.g. merge, compress, OCR, redact, split...)"
              className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-10 text-xs text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all border",
                  isSelected
                    ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {cat === "Favorites" ? `⭐ Favorites (${favorites.length})` : cat}
              </button>
            )
          })}
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {selectedCategory} Utilities
            </h2>
            <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-mono text-primary">
              {filteredTools.length} tools
            </span>
          </div>

          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery("")}
              className="text-[11px] text-primary hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center my-8">
            <p className="text-sm text-muted-foreground">No tools found matching &quot;{searchQuery}&quot;</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              className="mt-4 rounded-lg bg-muted border border-border px-4 py-2 text-xs font-bold text-primary hover:bg-muted/80 transition"
            >
              Show All Tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const Icon = toolIconMap[tool.id] || Sparkles
              const isFav = favorites.includes(tool.id)
              const localizedName = toolText(tool.id, "name") || tool.name
              const localizedDesc = toolText(tool.id, "description") || tool.description

              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
                >
                  <div>
                    {/* Top Row: Icon + Favorite Star */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-primary group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all">
                        <Icon className="h-5.5 w-5.5" />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, tool.id)}
                        className="text-muted-foreground hover:text-amber-500 transition-colors p-1"
                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={cn("h-4 w-4", isFav && "fill-amber-400 text-amber-400")} />
                      </button>
                    </div>

                    {/* Tool Name & Description */}
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {localizedName}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {localizedDesc}
                    </p>
                  </div>

                  {/* Bottom Row: Category Pill & Extension Tags */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-primary/30 bg-primary/10 text-primary">
                      {tool.category.replace(" Operations", "")}
                    </span>

                    <div className="flex items-center gap-1">
                      {tool.acceptedFileTypes.slice(0, 2).map((ext) => (
                        <span key={ext} className="text-[9px] font-mono text-muted-foreground uppercase">
                          {ext.replace("application/", "").replace(".", "")}
                        </span>
                      ))}
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Trust & Local Security Features Footer */}
      <section className="mx-auto max-w-7xl px-4 mt-20 pt-12 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">100% Client-Side Privacy</h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Your files and signatures are never uploaded to remote servers. All PDF processing, page rendering, and conversions take place strictly within your browser&apos;s memory sandbox.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Instant Web Worker Speed</h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Heavy document compilations, OCR scanning, and object stream compressions are offloaded to background web workers (`pdf.worker.ts`) to ensure zero UI lag.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">30+ Desktop Utility Tools</h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              From full Word & Docs editing to programmatic Bates stamping, electronic signing, PDF redaction, and multi-file conversions in one unified workspace.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
