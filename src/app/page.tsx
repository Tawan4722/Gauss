'use client'

import Link from "next/link"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/i18n"
import { toolRegistry } from "@/lib/tools/registry"
import { cn } from "@/lib/utils"
import {
  Image as ImageIcon,
  ScanText,
  FileText,
  FolderArchive,
  Hash,
  Info,
  Type,
  Layers,
  Sparkles,
  Compass,
  ArrowRight,
  Upload,
  ArrowUpRight
} from "lucide-react"

// Icon mapping helper for tools
const toolIconMap: Record<string, React.ComponentType<any>> = {
  image: ImageIcon,
  ocr: ScanText,
  pdf: FileText,
  text: Type,
  converter: Sparkles,
  archive: FolderArchive,
  batch: Layers,
  metadata: Info,
  checksum: Hash,
}

// Category mappings for rendering
const categoryKeyMap: Record<string, string> = {
  "Media & Vision": "category.media",
  "Documents & Text": "category.docs",
  "File Operations": "category.files",
  "Data & Security": "category.security",
}

export default function Home() {
  const { t, toolText } = useLanguage()
  const [activeTab, setActiveTab] = useState<string>("all")

  // Available tabs
  const tabs = useMemo(() => [
    { id: "all", labelKey: "category.all", icon: Compass },
    { id: "Media & Vision", labelKey: "category.media", icon: ImageIcon },
    { id: "Documents & Text", labelKey: "category.docs", icon: FileText },
    { id: "File Operations", labelKey: "category.files", icon: FolderArchive },
    { id: "Data & Security", labelKey: "category.security", icon: Hash },
  ], [])

  // Filter tools based on active tab
  const filteredTools = useMemo(() => {
    if (activeTab === "all") return toolRegistry
    return toolRegistry.filter((tool) => tool.category === activeTab)
  }, [activeTab])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050605] text-white">
      {/* Dynamic Futuristic Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.15),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(245,158,11,0.12),transparent_35%),linear-gradient(180deg,#050605_0%,#0f140e_45%,#030403_100%)]" />
      <div className="absolute inset-0 z-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:64px_64px]" />
      
      {/* Radial glows */}
      <div className="absolute top-[20%] left-[30%] -z-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px]" />
      <div className="absolute bottom-[20%] right-[30%] -z-10 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8">
        
        {/* HERO SECTION */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              {t("home.badge")}
            </span>
            <h1 className="text-6xl font-black tracking-[-0.06em] sm:text-8xl lg:text-[7.5rem] leading-none bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              Gauss
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              {t("home.description")}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                href="/tools/converter" 
                className="group flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_24px_rgba(255,255,255,0.15)] transition-all hover:bg-cyan-200 hover:shadow-[0_0_30px_rgba(165,243,252,0.3)]"
              >
                <span>{t("home.start")}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                href="/tools" 
                className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white/80 transition-all hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200"
              >
                {t("home.viewTools")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2.5rem] border border-white/[0.08] bg-white/[0.02] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
          >
            {/* Quick Upload Dragbox Link */}
            <Link
              href="/tools/converter"
              className="group relative flex min-h-[260px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-black/35 p-10 text-center transition-all duration-300 hover:border-cyan-400/45 hover:bg-cyan-950/10"
            >
              {/* Animated Glowing border on hover */}
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-r from-cyan-500/0 to-amber-500/0 opacity-0 blur-xl transition-all duration-500 group-hover:from-cyan-500/10 group-hover:to-amber-500/10 group-hover:opacity-100" />
              
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent shadow-inner transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-500/30 group-hover:from-cyan-500/20">
                <Upload className="h-7 w-7 text-white/50 group-hover:text-cyan-300 transition-colors" />
              </div>
              <span className="mt-6 text-lg font-bold tracking-tight text-white/90 group-hover:text-cyan-100 transition-colors">
                {t("home.uploadTitle")}
              </span>
              <span className="mt-2 max-w-xs text-xs leading-5 text-white/40 group-hover:text-white/60 transition-colors">
                {t("home.uploadDescription")}
              </span>
            </Link>
          </motion.div>
        </section>

        {/* ORDERLY TOOLBOX GRID */}
        <section className="mt-12 border-t border-white/[0.08] pt-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Orderly Toolbox
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Browse our file modules grouped cleanly by department.
              </p>
            </div>
          </div>

          {/* Pointable Tabs Filter Bar */}
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 backdrop-blur-xl mb-8">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-300",
                    isSelected 
                      ? "bg-cyan-200 text-zinc-950 shadow-[0_4px_20px_rgba(165,243,252,0.25)]" 
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{t(tab.labelKey) || tab.id}</span>
                </button>
              )
            })}
          </div>

          {/* Filtered Tools Grid */}
          <motion.div 
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool) => {
                const ToolIcon = toolIconMap[tool.id] || Sparkles
                const toolCategoryTranslated = t(categoryKeyMap[tool.category]) || tool.category
                const toolNameTranslated = toolText(tool.id, "name") || tool.name
                const toolDescTranslated = toolText(tool.id, "description") || tool.description

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    key={tool.id}
                  >
                    <Link
                      href={`/tools/${tool.id}`}
                      className="group flex h-full flex-col justify-between rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                    >
                      <div>
                        {/* Header: Icon & Launch indicator */}
                        <div className="flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/80 transition-all duration-300 group-hover:border-cyan-500/25 group-hover:bg-cyan-500/10 group-hover:text-cyan-300">
                            <ToolIcon className="h-5 w-5" />
                          </div>
                          <span className="rounded-full bg-white/[0.05] p-2 text-white/30 transition-all duration-300 group-hover:bg-cyan-500/15 group-hover:text-cyan-300">
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </div>

                        {/* Title and Category */}
                        <div className="mt-6">
                          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/50">
                            {toolCategoryTranslated}
                          </span>
                          <h3 className="mt-2 text-lg font-bold tracking-tight text-white transition-colors group-hover:text-cyan-100">
                            {toolNameTranslated}
                          </h3>
                          <p className="mt-2 text-xs leading-5 text-white/45">
                            {toolDescTranslated}
                          </p>
                        </div>
                      </div>

                      {/* Footer detail */}
                      <div className="mt-8 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/20 transition-colors group-hover:text-cyan-300/60">
                        <span>Launch Utility</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </section>

      </div>
    </main>
  )
}
