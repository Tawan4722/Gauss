import type { Metadata } from "next"
import { notFound } from "next/navigation"

import ToolWorkspace from "@/components/tools/ToolWorkspace"
import { getToolById, toolRegistry } from "@/lib/tools/registry"

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

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params

  if (!getToolById(toolId)) {
    notFound()
  }

  return <ToolWorkspace key={toolId} toolId={toolId} />
}

