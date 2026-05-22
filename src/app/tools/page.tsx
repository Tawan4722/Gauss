import type { Metadata } from "next"

import AllToolsWorkspace from "@/components/tools/AllToolsWorkspace"

export const metadata: Metadata = {
  title: "All Tools | Gauss",
  description: "Use every Gauss file utility from a single all-in-one workspace.",
}

export default function ToolsIndexPage() {
  return <AllToolsWorkspace />
}
