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
  ArrowUpRight,
  Scissors,
  FilePlus
} from "lucide-react"

// Icon mapping helper for tools
const toolIconMap: Record<string, React.ComponentType<any>> = {
  image: ImageIcon,
  ocr: ScanText,
  "merge-pdf": Layers,
  "split-pdf": Scissors,
  "bates-pdf": Hash,
  "watermark-pdf": Type,
  "grayscale-pdf": FileText,
  "create-pdf": FilePlus,
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
    <main className="relative min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-6 pb-24 pt-28">
        
        {/* Minimal Hero Header */}
        <header className="space-y-4 pb-12 pt-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Gauss
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-zinc-400">
            {t("home.description")}
          </p>
        </header>

        {/* Toolbox Section */}
        <section className="mt-4 border-t border-zinc-900 pt-8">
          {/* Pointable Tabs Filter Bar */}
          <div className="flex flex-wrap gap-6 border-b border-zinc-900 pb-4 mb-8">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] transition-all duration-200",
                    isSelected 
                      ? "text-white" 
                      : "text-zinc-500 hover:text-zinc-300"
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
                const toolNameTranslated = toolText(tool.id, "name") || tool.name
                const toolDescTranslated = toolText(tool.id, "description") || tool.description

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    key={tool.id}
                  >
                    <Link
                      href={`/tools/${tool.id}`}
                      className="group block rounded-2xl border border-zinc-900 bg-zinc-950/20 p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 group-hover:text-white transition-colors">
                          <ToolIcon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors">
                          {toolNameTranslated}
                        </h3>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                        {toolDescTranslated}
                      </p>
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
