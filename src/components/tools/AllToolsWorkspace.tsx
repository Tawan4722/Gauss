'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AllToolsWorkspace() {
  const router = useRouter()

  useEffect(() => {
    let targetTool = "converter"
    try {
      const prefsStr = localStorage.getItem("gauss-preferences")
      const lastTool = localStorage.getItem("gauss-last-tool")
      
      // Default preference is true, so if there's no preference stored, we still honor lastTool
      let remember = true
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr)
        if (prefs.rememberLastTool === false) {
          remember = false
        }
      }

      if (remember && lastTool) {
        targetTool = lastTool
      }
    } catch {
      // Ignore errors
    }
    
    router.replace(`/tools/${targetTool}`)
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-xs tracking-[0.2em] uppercase">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-650 border-t-transparent" />
        <span>Initializing Workspace...</span>
      </div>
    </div>
  )
}
