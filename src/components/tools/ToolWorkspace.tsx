'use client'

import { useMemo, useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/lib/i18n"
import { processTool, type ToolOutput } from "@/lib/tools/processors"
import {
  getDefaultSettings,
  getToolById,
  toolRegistry,
  type ToolSetting,
  type ToolSettingValue,
  type ToolSettings,
} from "@/lib/tools/registry"
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
  Upload,
  Trash2,
  Download,
  Check,
  ChevronRight,
  Settings,
  AlertCircle,
  FolderOpen,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RefreshCw,
  LayoutGrid
} from "lucide-react"

import LayoutSandbox, { type SandboxConfig } from "@/components/tools/LayoutSandbox"

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

// Category translation keys mapping
const categoryKeyMap: Record<string, string> = {
  "Media & Vision": "category.media",
  "Documents & Text": "category.docs",
  "File Operations": "category.files",
  "Data & Security": "category.security",
}

const bytesToSize = (bytes: number) => {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Specification 6: Asynchronous MIME-type file signature (magic number) verification
const getFileSignatureMatches = (file: File, acceptedTypes: string[]): Promise<boolean> => {
  if (acceptedTypes.includes("*/*")) return Promise.resolve(true)

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (!reader.result || !(reader.result instanceof ArrayBuffer)) {
        resolve(false)
        return
      }

      const arr = new Uint8Array(reader.result)
      let header = ""
      for (let i = 0; i < Math.min(arr.length, 8); i++) {
        header += arr[i].toString(16).padStart(2, "0").toUpperCase()
      }

      // Read binary header patterns
      const isPdf = header.startsWith("25504446") // %PDF
      const isPng = header.startsWith("89504E47") // \x89PNG
      const isJpeg = header.startsWith("FFD8FF")   // JPEG start
      const isGif = header.startsWith("47494638")  // GIF8
      const isZip = header.startsWith("504B0304")  // PK ZIP

      const matches = acceptedTypes.some((type) => {
        if (type.includes("pdf")) return isPdf
        if (type.includes("png")) return isPng
        if (type.includes("jpeg") || type.includes("jpg")) return isJpeg
        if (type.includes("gif")) return isGif
        if (type.includes("zip") || type.includes("archive")) return isZip
        if (type.includes("image/")) return isPng || isJpeg || isGif
        
        // Fallback to name match for text files
        if (type.endsWith("/*")) return file.type.startsWith(type.replace("/*", "/"))
        if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type.toLowerCase())
        return file.type === type
      })

      resolve(matches)
    }

    // Read first 8 bytes of the file for binary pattern verification
    reader.readAsArrayBuffer(file.slice(0, 8))
  })
}

function SettingControl({
  toolId,
  setting,
  value,
  onChange,
}: {
  toolId: string
  setting: ToolSetting
  value: ToolSettingValue
  onChange: (value: ToolSettingValue) => void
}) {
  const { settingText, optionText } = useLanguage()
  const id = `setting-${setting.name}`
  const label = settingText(toolId, setting.name, setting.label)

  if (setting.type === "checkbox") {
    return (
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-white/75 cursor-pointer hover:bg-white/[0.04] transition duration-200">
        <span>{label}</span>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-zinc-950 text-cyan-400 accent-cyan-300 focus:ring-cyan-500/30"
        />
      </label>
    )
  }

  if (setting.type === "select") {
    return (
      <label className="grid gap-2 text-sm text-white/70" htmlFor={id}>
        <span>{label}</span>
        <select
          id={id}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-2xl border border-white/[0.08] bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 focus:ring-1 focus:ring-cyan-300/60 hover:bg-zinc-900/60 cursor-pointer"
        >
          {setting.options?.map((option) => (
            <option key={option} value={option}>
              {optionText(option)}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (setting.type === "slider") {
    return (
      <label className="grid gap-3 text-sm text-white/70" htmlFor={id}>
        <span className="flex items-center justify-between gap-3">
          <span>{label}</span>
          <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-xs text-cyan-300 font-bold">{String(value)}</span>
        </span>
        <input
          id={id}
          type="range"
          min={setting.min}
          max={setting.max}
          step={setting.step ?? 1}
          value={Number(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-cyan-300 outline-none hover:bg-white/15"
        />
      </label>
    )
  }

  return (
    <label className="grid gap-2 text-sm text-white/70" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="text"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-1 focus:ring-cyan-300/60 hover:bg-white/[0.04]"
      />
    </label>
  )
}

interface EditorPage {
  id: string
  fileIndex: number
  pageIndex: number
  rotation: number
  originalFileName: string
}

export default function ToolWorkspace({ toolId }: { toolId: string }) {
  const tool = getToolById(toolId)
  const router = useRouter()
  const { t, toolText } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [settings, setSettings] = useState<ToolSettings>(() => (tool ? getDefaultSettings(tool) : {}))
  const [outputs, setOutputs] = useState<ToolOutput[]>([])
  const [summary, setSummary] = useState("")
  const [notice, setNotice] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Layout Sandbox & PDF Editor States
  const [editorPages, setEditorPages] = useState<EditorPage[]>([])
  const [workspaceView, setWorkspaceView] = useState<"visual" | "list">("visual")
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig | undefined>(undefined)

  const acceptedLabel = useMemo(() => tool?.acceptedFileTypes.join(", ") ?? "", [tool])

  // Group tools by category for the sidebar
  const categorizedTools = useMemo(() => {
    const groups: Record<string, typeof toolRegistry> = {}
    toolRegistry.forEach((t) => {
      const cat = t.category
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(t)
    })
    return groups
  }, [])

  // Update saved last active tool
  useEffect(() => {
    try {
      localStorage.setItem("gauss-last-tool", toolId)
    } catch {
      // Ignore errors
    }
  }, [toolId])

  // Reconcile editor pages when files change (for PDF Desk)
  useEffect(() => {
    if (toolId !== "pdf") return

    let active = true

    async function reconcile() {
      if (files.length === 0) {
        if (active) setEditorPages([])
        return
      }

      try {
        const { PDFDocument } = await import("pdf-lib")
        const filePageCounts = await Promise.all(
          files.map(async (file) => {
            try {
              const pdf = await PDFDocument.load(await file.arrayBuffer())
              return pdf.getPageCount()
            } catch {
              return 0
            }
          })
        )

        if (!active) return

        setEditorPages((prev) => {
          const newPages: EditorPage[] = []

          prev.forEach((page) => {
            const matchIndex = files.findIndex((f) => f.name === page.originalFileName)
            if (matchIndex !== -1) {
              newPages.push({
                ...page,
                fileIndex: matchIndex,
              })
            }
          })

          const existingFileNames = new Set(prev.map((p) => p.originalFileName))
          files.forEach((file, fileIndex) => {
            if (!existingFileNames.has(file.name)) {
              const pageCount = filePageCounts[fileIndex]
              for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                newPages.push({
                  id: `${file.name}-${file.size}-${fileIndex}-page-${pageIndex}-${crypto.randomUUID()}`,
                  fileIndex,
                  pageIndex,
                  rotation: 0,
                  originalFileName: file.name,
                })
              }
            }
          })

          return newPages
        })
      } catch (error) {
        console.error("Failed to reconcile PDF pages", error)
      }
    }

    reconcile()

    return () => {
      active = false
    }
  }, [files, toolId])

  if (!tool) {
    return null
  }

  const addFiles = async (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles)
    
    // Asynchronous MIME-type signature verification
    const matchesArray = await Promise.all(
      nextFiles.map(async (file) => {
        const matches = await getFileSignatureMatches(file, tool.acceptedFileTypes)
        return { file, matches }
      })
    )
    
    const validFiles = matchesArray.filter((item) => item.matches).map((item) => item.file)
    const rejectedCount = nextFiles.length - validFiles.length

    setFiles((currentFiles) => {
      const existingKeys = new Set(currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      const uniqueFiles = validFiles.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`))
      return [...currentFiles, ...uniqueFiles]
    })

    setOutputs([])
    setSummary("")
    setNotice(rejectedCount > 0 ? `${rejectedCount} file${rejectedCount === 1 ? "" : "s"} did not match verified type signatures.` : "")
  }

  const removeFile = (index: number) => {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index))
    setOutputs([])
    setSummary("")
  }

  // Page Editor Functions
  const movePage = (index: number, direction: number) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= editorPages.length) return
    setEditorPages((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
    setOutputs([])
    setSummary("")
  }

  const rotatePage = (index: number) => {
    setEditorPages((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        rotation: (next[index].rotation + 90) % 360,
      }
      return next
    })
    setOutputs([])
    setSummary("")
  }

  const deletePage = (index: number) => {
    setEditorPages((prev) => prev.filter((_, idx) => idx !== index))
    setOutputs([])
    setSummary("")
  }

  const resetEditorLayout = async () => {
    if (files.length === 0) return
    try {
      const { PDFDocument } = await import("pdf-lib")
      const filePageCounts = await Promise.all(
        files.map(async (file) => {
          try {
            const pdf = await PDFDocument.load(await file.arrayBuffer())
            return pdf.getPageCount()
          } catch {
            return 0
          }
        })
      )
      const resetPages = files.flatMap((file, fileIndex) => {
        const count = filePageCounts[fileIndex]
        return Array.from({ length: count }, (_, pageIndex) => ({
          id: `${file.name}-${file.size}-${fileIndex}-page-${pageIndex}-${crypto.randomUUID()}`,
          fileIndex,
          pageIndex,
          rotation: 0,
          originalFileName: file.name,
        }))
      })
      setEditorPages(resetPages)
      setOutputs([])
      setSummary("")
    } catch (e) {
      console.error(e)
    }
  }

  // Action processor integration (Web Workers vs Main Thread fallback)
  const processFiles = async () => {
    if (files.length === 0) {
      setNotice(t("workspace.addFiles"))
      return
    }

    setIsProcessing(true)
    setNotice("")

    try {
      const mergedSettings = { ...settings }
      
      // Inject visual editor pages if active in PDF mode
      if (toolId === "pdf" && editorPages.length > 0) {
        const compactPages = editorPages.map((p) => ({
          fileIndex: p.fileIndex,
          pageIndex: p.pageIndex,
          rotation: p.rotation,
        }))
        mergedSettings.editorPagesJson = JSON.stringify(compactPages)
      }

      // Specification 6: Spawns Web Worker thread separation for PDF assembly tasks
      if (typeof window !== "undefined" && window.Worker && toolId === "pdf") {
        const fileBuffers = await Promise.all(
          files.map(async (file) => {
            const buffer = await file.arrayBuffer()
            return {
              name: file.name,
              type: file.type,
              buffer,
            }
          })
        )

        // Spawn pdf.worker background thread
        const worker = new Worker(new URL("@/workers/pdf.worker.ts", import.meta.url))
        
        worker.onmessage = (event) => {
          const result = event.data
          if (result.success) {
            const blob = new Blob([result.buffer], { type: "application/pdf" })
            const outputName = mergedSettings.action === "Bates Stamping" ? "gauss-stamped.pdf" : "gauss-compiled.pdf"
            
            const compiledOutput = {
              id: `${outputName}-${blob.size}-${crypto.randomUUID()}`,
              name: outputName,
              type: "application/pdf",
              size: blob.size,
              blob,
              message: `Compiled ${result.pageCount} pages in background thread.`,
            }
            
            setOutputs([compiledOutput])
            setSummary(`PDF worker compilation completed successfully. Output size: ${bytesToSize(blob.size)}.`)
          } else {
            setNotice(result.error || t("workspace.failed"))
          }
          setIsProcessing(false)
          worker.terminate()
        }

        worker.onerror = (err) => {
          console.error("Worker crash", err)
          setNotice("Web Worker background process failed to execute.")
          setIsProcessing(false)
          worker.terminate()
        }

        // Post array buffers inside Transferable list for zero-copy memory transit
        const transferableList = fileBuffers.map((f) => f.buffer)
        worker.postMessage(
          {
            files: fileBuffers,
            editorPages: editorPages.map((p) => ({
              fileIndex: p.fileIndex,
              pageIndex: p.pageIndex,
              rotation: p.rotation,
            })),
            settings: mergedSettings,
            config: sandboxConfig,
          },
          transferableList
        )

      } else {
        // Fallback to main-thread processing if workers are unavailable
        const result = await processTool(tool, files, mergedSettings)
        setOutputs(result.outputs)
        setSummary(result.summary)
        setIsProcessing(false)
      }

    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("workspace.failed"))
      setIsProcessing(false)
    }
  }

  const downloadAll = async () => {
    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].name)
      return
    }

    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    outputs.forEach((output) => zip.file(output.name, output.blob))
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } })
    downloadBlob(blob, `${tool.id}-outputs.zip`)
  }

  return (
    <main className="min-h-screen bg-[#050605] text-white pt-32 pb-16 relative">
      {/* Background spotlight gradients */}
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.1),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.08),transparent_40%),linear-gradient(180deg,#050605_0%,#0c0e0c_100%)]" />
      
      {/* Container */}
      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Sidebar Navigation */}
        <aside className="hidden lg:block w-[280px] shrink-0 self-start sticky top-28 space-y-6">
          <div className="rounded-3xl border border-white/[0.06] bg-black/35 p-5 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 pb-4 border-b border-white/5">
              Workspace Suite
            </h2>
            <div className="mt-4 space-y-5">
              {Object.entries(categorizedTools).map(([category, tools]) => {
                const categoryLabel = t(categoryKeyMap[category]) || category
                return (
                  <div key={category} className="space-y-1.5">
                    <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-cyan-200/50 px-2 mb-1">
                      {categoryLabel}
                    </span>
                    <div className="space-y-0.5">
                      {tools.map((item) => {
                        const Icon = toolIconMap[item.id] || Sparkles
                        const isActive = item.id === toolId
                        return (
                          <Link
                            key={item.id}
                            href={`/tools/${item.id}`}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold tracking-tight transition-all duration-200",
                              isActive
                                ? "bg-cyan-500/10 text-cyan-200 border-l-2 border-cyan-400 font-bold shadow-[0_0_15px_rgba(34,211,238,0.08)]"
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                            )}
                          >
                            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-cyan-300" : "text-white/40")} />
                            <span>{toolText(item.id, "name") || item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Workspace workspace */}
        <section className="flex-1 min-w-0">
          
          {/* Mobile dropdown selector */}
          <div className="lg:hidden mb-6 p-4 rounded-2xl border border-white/[0.08] bg-black/45 backdrop-blur-xl">
            <label htmlFor="mobile-tool-select" className="text-[10px] font-black uppercase tracking-wider text-cyan-200/50 block mb-2">
              Select Workspace Tool
            </label>
            <select
              id="mobile-tool-select"
              value={toolId}
              onChange={(e) => router.push(`/tools/${e.target.value}`)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none transition focus:border-cyan-300"
            >
              {toolRegistry.map((item) => (
                <option key={item.id} value={item.id}>
                  {toolText(item.id, "name") || item.name} ({t(categoryKeyMap[item.category]) || item.category})
                </option>
              ))}
            </select>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header info */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/50">
                {t(categoryKeyMap[tool.category]) || tool.category}
              </span>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
                {toolText(tool.id, "name") || tool.name}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/50 max-w-3xl">
                {toolText(tool.id, "description") || tool.description}
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                addFiles(event.dataTransfer.files)
              }}
              className={cn(
                "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-6 text-center shadow-xl backdrop-blur-xl transition-all duration-300",
                isDragging 
                  ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]" 
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={tool.acceptedFileTypes.join(",")}
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files)
                  event.target.value = ""
                }}
                className="hidden"
              />
              <div className={cn(
                "grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent shadow-inner transition-all duration-300",
                isDragging && "border-cyan-500/30 from-cyan-500/20"
              )}>
                <Upload className={cn("h-5 w-5 text-white/40 transition-colors", isDragging && "text-cyan-300")} />
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight text-white/90">
                {t("workspace.dropTitle")}
              </h3>
              <p className="mt-1 max-w-md text-[10px] leading-5 text-white/35">
                {t("workspace.accepted")}: <code className="text-cyan-200/60 font-mono">{acceptedLabel}</code>. Verified via binary headers.
              </p>
            </div>

            {notice && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5 text-xs text-amber-200"
              >
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{notice}</span>
              </motion.div>
            )}

            {/* Layout Panels: Visual PDF editor vs. File items */}
            {toolId === "pdf" && files.length > 0 ? (
              <div className="rounded-[2.25rem] border border-white/[0.06] bg-black/25 p-5 shadow-2xl backdrop-blur-xl space-y-4">
                
                {/* View Selector Tabs */}
                <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-white/5">
                  <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setWorkspaceView("visual")}
                      className={cn(
                        "rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        workspaceView === "visual"
                          ? "bg-cyan-200 text-zinc-950 font-black shadow-sm"
                          : "text-white/50 hover:text-white"
                      )}
                    >
                      Visual Organizer
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceView("list")}
                      className={cn(
                        "rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        workspaceView === "list"
                          ? "bg-cyan-200 text-zinc-950 font-black shadow-sm"
                          : "text-white/50 hover:text-white"
                      )}
                    >
                      Source Files ({files.length})
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    {workspaceView === "visual" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSandboxOpen(true)}
                          className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/20 shadow-md"
                        >
                          <LayoutGrid className="h-3 w-3" />
                          <span>Layout Sandbox</span>
                        </button>
                        <button
                          type="button"
                          onClick={resetEditorLayout}
                          className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 transition hover:border-cyan-300/30 hover:text-cyan-200"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Reset Pages</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 1. VISUAL PAGE ORGANIZER VIEW */}
                {workspaceView === "visual" && (
                  <div className="space-y-4">
                    {editorPages.length === 0 ? (
                      <p className="py-12 text-center text-xs text-white/30 font-medium">
                        No pages to preview. Check source documents.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 max-h-[500px] overflow-y-auto pr-1">
                        {editorPages.map((page, index) => (
                          <div 
                            key={page.id} 
                            className="group/card relative rounded-2xl border border-white/5 bg-white/[0.01] p-3 flex flex-col items-center justify-between text-center transition-all duration-200 hover:border-white/15 hover:bg-white/[0.03]"
                          >
                            {/* Visual Rotation Canvas */}
                            <div className="relative w-16 h-22 my-4 bg-zinc-950 border border-white/10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 group-hover/card:border-cyan-500/30">
                              <div className="absolute inset-0 bg-cyan-500/0 transition-colors group-hover/card:bg-cyan-500/5" />
                              
                              <div 
                                className="w-10 h-14 flex items-center justify-center text-white/30 transition-transform duration-300"
                                style={{ transform: `rotate(${page.rotation}deg)` }}
                              >
                                <FileText className="h-8 w-8 text-cyan-200/40" />
                              </div>
                              <span className="absolute bottom-1 right-1.5 font-mono text-[9px] text-white/20">
                                P.{page.pageIndex + 1}
                              </span>
                            </div>

                            {/* Label */}
                            <div className="w-full text-center px-1">
                              <span className="block text-[10px] font-black tracking-wide text-cyan-300 bg-cyan-950/40 border border-cyan-500/10 px-2 py-0.5 rounded-full inline-block">
                                Page {index + 1}
                              </span>
                              <p className="mt-1.5 truncate text-[9px] text-white/30" title={page.originalFileName}>
                                {page.originalFileName}
                              </p>
                            </div>

                            {/* visual organizer button bar */}
                            <div className="mt-3 flex items-center justify-center gap-1 border-t border-white/5 pt-2 w-full">
                              <button
                                type="button"
                                onClick={() => movePage(index, -1)}
                                disabled={index === 0}
                                className="p-1 rounded bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Move Left"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => rotatePage(index)}
                                className="p-1 rounded bg-white/[0.03] text-cyan-300/60 hover:bg-cyan-500/10 hover:text-cyan-300"
                                title="Rotate 90°"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => deletePage(index)}
                                className="p-1 rounded bg-white/[0.03] text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete Page"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => movePage(index, 1)}
                                disabled={index === editorPages.length - 1}
                                className="p-1 rounded bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Move Right"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. FILE ITEMS VIEW */}
                {workspaceView === "list" && (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white/90">{file.name}</p>
                            <p className="mt-0.5 text-[10px] text-white/35 font-mono">{bytesToSize(file.size)} | {file.type || "unknown"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Regular select files list layout (non-PDF or no files uploaded) */
              <div className="rounded-[2rem] border border-white/[0.06] bg-black/20 p-6 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-white/40" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">{t("workspace.selected")}</h2>
                    {files.length > 0 && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xxs font-bold text-white/80">{files.length}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([])
                      setOutputs([])
                      setSummary("")
                    }}
                    disabled={files.length === 0}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/55 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {t("workspace.clear")}
                  </button>
                </div>

                <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {files.length === 0 ? (
                      <p className="py-8 text-center text-xs text-white/30 font-medium">
                        {t("workspace.noFiles")}
                      </p>
                    ) : (
                      files.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition duration-200"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-white/90">{file.name}</p>
                              <p className="mt-0.5 text-[10px] text-white/35 font-mono">{bytesToSize(file.size)} | {file.type || "unknown"}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition"
                            aria-label="Remove file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </section>

        {/* RIGHT COLUMN: Settings Panel & Outputs */}
        <aside className="w-full lg:w-[380px] shrink-0 self-start lg:sticky lg:top-28 space-y-6">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <Settings className="h-4 w-4 text-white/40" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">{t("workspace.settings")}</h2>
            </div>
            
            {/* Setting items */}
            <div className="mt-5 space-y-5">
              {tool.settingsSchema.map((setting) => (
                <SettingControl
                  key={setting.name}
                  toolId={tool.id}
                  setting={setting}
                  value={settings[setting.name]}
                  onChange={(value) => {
                    setSettings((currentSettings) => ({ ...currentSettings, [setting.name]: value }))
                    setOutputs([])
                    setSummary("")
                  }}
                />
              ))}
            </div>

            {/* Run Button */}
            <button
              type="button"
              onClick={processFiles}
              disabled={isProcessing || files.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-200 px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 transition duration-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_4px_24px_rgba(165,243,252,0.15)] active:translate-y-0.5"
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  <span>{t("workspace.processing")}</span>
                </>
              ) : (
                <span>{t("workspace.process")}</span>
              )}
            </button>
          </div>

          {/* Outputs Area */}
          <div className="rounded-3xl border border-white/[0.06] bg-black/40 p-5 backdrop-blur-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 pb-3 border-b border-white/5">
              {t("workspace.outputs")}
            </h3>
            
            {summary ? (
              <p className="mt-3 text-xs leading-5 text-cyan-300/80 bg-cyan-500/5 border border-cyan-500/10 rounded-xl px-3 py-2">
                {summary}
              </p>
            ) : (
              <p className="mt-3 text-center py-6 text-xs text-white/30 font-medium">
                {t("workspace.outputHint")}
              </p>
            )}

            {outputs.length > 0 && (
              <div className="mt-4 space-y-2">
                {outputs.map((output) => (
                  <div key={output.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white/90">{output.name}</p>
                      <p className="mt-0.5 text-[10px] text-white/35 font-mono">{bytesToSize(output.size)} | {output.type}</p>
                      {output.message && (
                        <p className="mt-1.5 text-[10px] leading-4 text-white/50">{output.message}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadBlob(output.blob, output.name)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/80 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t("workspace.download")}</span>
                    </button>
                  </div>
                ))}

                {outputs.length > 1 && (
                  <button
                    type="button"
                    onClick={downloadAll}
                    className="w-full mt-2 rounded-xl bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-cyan-200 shadow-md"
                  >
                    {t("workspace.downloadAll")}
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* Specification 5: Interactive coordinate sandbox layout preview modal */}
      <LayoutSandbox
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        onSave={(config) => {
          setSandboxConfig(config)
          setOutputs([])
          setSummary("")
        }}
        initialConfig={sandboxConfig}
        pageCount={editorPages.length}
      />
    </main>
  )
}
