'use client'

import { useState } from "react"

import ToolWorkspace from "@/components/tools/ToolWorkspace"
import { useLanguage } from "@/lib/i18n"
import { toolRegistry } from "@/lib/tools/registry"
import { cn } from "@/lib/utils"

export default function AllToolsWorkspace() {
  const [activeToolId, setActiveToolId] = useState(toolRegistry[0]?.id ?? "image")
  const { t, toolText } = useLanguage()

  return (
    <div className="bg-[#070807]">
      <section className="relative z-20 mx-auto max-w-7xl px-5 pt-32 text-white sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">{t("all.badge")}</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-7xl">{t("all.title")}</h1>
        <p className="mt-5 max-w-2xl text-white/55">{t("all.description")}</p>
        <div className="mt-8 grid grid-cols-2 gap-2 rounded-[2rem] border border-white/10 bg-white/[0.045] p-2 shadow-2xl backdrop-blur-xl sm:grid-cols-3 lg:grid-cols-9">
          {toolRegistry.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveToolId(tool.id)}
              className={cn(
                "rounded-full px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                activeToolId === tool.id ? "bg-cyan-200 text-zinc-950 shadow-[0_0_24px_rgba(165,243,252,0.25)]" : "text-white/55 hover:bg-white/10 hover:text-white",
              )}
            >
              {toolText(tool.id, "category") || tool.category}
            </button>
          ))}
        </div>
      </section>
      <ToolWorkspace key={activeToolId} toolId={activeToolId} />
    </div>
  )
}
