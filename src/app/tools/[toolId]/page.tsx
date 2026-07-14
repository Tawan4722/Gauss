import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import ToolWorkspace from "@/components/tools/ToolWorkspace"
import { getToolById, toolRegistry } from "@/lib/tools/registry"

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    { params: { toolId: "editor" } },
    { params: { toolId: "organize-pdf" } }
  ]
}

type ToolPageProps = {
  params: Promise<{ toolId: string }>
}

export function generateStaticParams() {
  return toolRegistry.map((tool) => ({ toolId: tool.id }))
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolId } = await params
  const tool = getToolById(toolId)

  if (!tool) {
    return { title: "Tool not found | Gauss" }
  }

  return {
    title: `${tool.name} | Gauss`,
    description: tool.description,
  }
}

function ToolPageContent({ toolId }: { toolId: string }) {
  if (!getToolById(toolId)) {
    notFound()
  }

  return <ToolWorkspace key={toolId} toolId={toolId} />
}

export default async function ToolPage({ params }: ToolPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-xs tracking-[0.2em] uppercase">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" />
            <span>Loading Workspace Layout...</span>
          </div>
        </div>
      }
    >
      {params.then(({ toolId }) => (
        <ToolPageContent toolId={toolId} />
      ))}
    </Suspense>
  )
}
