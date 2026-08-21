'use client'

import { useState, useRef, useMemo } from "react"
import Link from "next/link"
import { 
  Trash2, Download, RefreshCw,
  Minimize, Cloud,
  FileText, Upload, Plus, RotateCw,
  CheckCircle2, ArrowRight
} from "lucide-react"
import WordEditor from "./WordEditor"
import { toolRegistry, type ToolSettings } from "@/lib/tools/registry"
import { processTool, type ToolOutput, type ToolProcessConfig } from "@/lib/tools/processors"
import LayoutSandbox, { type SandboxConfig } from "./LayoutSandbox"
import { cn } from "@/lib/utils"

// Document record type
interface DocumentRecord {
  id: string
  title: string
  content: string
  updatedAt: string
}

// Templates for Local Documents Explorer
const DOCUMENT_TEMPLATES = [
  {
    id: "template-blank",
    title: "Blank Document",
    content: `<h1 style="font-family:'Geist Sans';font-size:24pt;color:#22d3ee;margin:0 0 16px;">New Document</h1><p style="font-family:'Geist Sans';font-size:11pt;color:#e4e4e7;">Start writing here...</p>`
  },
  {
    id: "template-resume",
    title: "Professional Resume",
    content: `<h1 style="font-family:'Geist Sans';font-size:28pt;color:#22d3ee;margin:0 0 4px;font-weight:bold;">ALEX MORTON</h1>
              <p style="color:#a1a1aa;font-size:10pt;margin:0 0 20px;">San Francisco, CA | alex@gauss.local | (555) 019-2831</p>
              <h2 style="font-size:14pt;color:#22d3ee;border-bottom:1px solid #27272a;padding-bottom:4px;margin-top:24px;">PROFESSIONAL EXPERIENCE</h2>
              <p style="font-weight:bold;margin:8px 0 2px;color:#f4f4f5;">Senior Systems Engineer — Gauss Labs (2024 - Present)</p>
              <p style="font-size:10pt;color:#d4d4d8;">Led the development of privacy-first client-side document processing architectures. Offloaded computationally intensive file streams to local web worker threads, resulting in a 40% reduction in CPU rendering delay.</p>`
  },
  {
    id: "template-proposal",
    title: "Project Proposal",
    content: `<h1 style="font-family:'Geist Sans';font-size:26pt;color:#22d3ee;margin:0 0 8px;font-weight:bold;">PROJECT GAUSS STUDIO</h1>
              <p style="font-size:12pt;color:#fbbf24;margin-bottom:24px;">Secure Offline Document Utilities Platform</p>
              <p style="font-size:10pt;color:#e4e4e7;line-height:1.7;">Gauss Document Studio provides desktop-grade file formatting, programmatic Bates numbering, visual redaction, and multi-file conversions completely in browser memory.</p>`
  }
]

export default function ToolWorkspace({ toolId: initialToolId }: { toolId: string }) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Active Tool selection
  const [activeToolId, setActiveToolId] = useState(initialToolId || "merge-pdf")
  const [prevInitialToolId, setPrevInitialToolId] = useState(initialToolId)

  // File & Page Management States (iLovePDF Style Canvas)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({}) // index -> angle (90, 180, 270)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Processing & Output states
  const [processing, setProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processLog, setProcessLog] = useState("")
  const [outputs, setOutputs] = useState<ToolOutput[]>([])
  const [successState, setSuccessState] = useState(false)

  // Tool Settings state
  const [toolSettings, setToolSettings] = useState<ToolSettings>({})

  // Layout Sandbox Config state
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>({
    watermarkText: "CONFIDENTIAL",
    watermarkX: 180,
    watermarkY: 420,
    watermarkSize: 60,
    watermarkOpacity: 0.15,
    signatureText: "Authorized Signatory",
    signatureX: 380,
    signatureY: 100,
    signatureScale: 1.0,
    batesX: 450,
    batesY: 36,
    batesFontSize: 10,
    showBates: false,
    showWatermark: true,
    showSignature: false,
  })

  // Word Editor Document State (for "editor" tool)
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem("gauss-docs")
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignore
    }
    return DOCUMENT_TEMPLATES.map(t => ({
      id: t.id,
      title: t.title,
      content: t.content,
      updatedAt: new Date().toISOString()
    }))
  })
  const [activeDocId] = useState<string>(() => documents[0]?.id || "template-blank")
  const [watermarkText] = useState("")
  const [showPageNumbers, setShowPageNumbers] = useState(true)
  const [margins, setMargins] = useState("normal")
  const [orientation, setOrientation] = useState<"Portrait" | "Landscape">("Portrait")
  const [pageSize, setPageSize] = useState<"A4" | "Letter" | "Legal">("A4")
  const [wordCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  // Sync activeToolId if initialToolId prop changes
  if (initialToolId !== prevInitialToolId) {
    setPrevInitialToolId(initialToolId)
    setActiveToolId(initialToolId)
    setUploadedFiles([])
    setPageRotations({})
    setOutputs([])
    setSuccessState(false)
  }

  const activeTool = useMemo(() => toolRegistry.find(t => t.id === activeToolId) || toolRegistry[0], [activeToolId])

  // File Handlers
  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return
    setUploadedFiles(prev => [...prev, ...fileArray])
    setSuccessState(false)
    setOutputs([])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const rotateFile = (index: number, delta: number) => {
    setPageRotations(prev => {
      const current = prev[index] || 0
      const next = (current + delta + 360) % 360
      return { ...prev, [index]: next }
    })
  }

  // Web Worker Execution
  const executeInWorker = (toolId: string, files: File[], settings: ToolSettings, config?: ToolProcessConfig | SandboxConfig): Promise<ToolOutput[]> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url))
        
        worker.onmessage = async (e) => {
          if (e.data.success) {
            const outBlob = new Blob([e.data.buffer], { type: "application/pdf" })
            const name = toolId === "merge-pdf" ? "merged.pdf" 
                         : toolId === "split-pdf" ? "split.pdf"
                         : toolId === "compress-pdf" ? "compressed.pdf"
                         : toolId === "watermark-pdf" ? "watermarked.pdf"
                         : "processed.pdf"
            const output: ToolOutput = {
              id: crypto.randomUUID(),
              name,
              type: outBlob.type,
              size: outBlob.size,
              blob: outBlob,
              message: `Processed locally in browser. ${e.data.pageCount || 1} pages.`
            }
            resolve([output])
          } else {
            reject(new Error(e.data.error || "Worker processing error"))
          }
          worker.terminate()
        }
        
        worker.onerror = (err) => {
          reject(err)
          worker.terminate()
        }
        
        Promise.all(files.map(async f => {
          const buf = await f.arrayBuffer()
          return { name: f.name, type: f.type, buffer: buf }
        })).then(serialized => {
          const transferables = serialized.map(s => s.buffer)
          worker.postMessage({
            files: serialized,
            toolId,
            settings,
            config
          }, transferables)
        }).catch(reject)
      } catch (err) {
        reject(err)
      }
    })
  }

  // Action Execution Handler
  const handleExecute = async () => {
    if (uploadedFiles.length === 0 && activeToolId !== "word-to-pdf" && activeToolId !== "editor") {
      setProcessLog("Please select at least one file before processing.")
      return
    }

    setProcessing(true)
    setProcessProgress(20)
    setProcessLog("Initializing local browser sandbox...")

    try {
      setProcessProgress(50)
      setProcessLog("Offloading data stream to local Web Worker...")

      let resultOutputs: ToolOutput[] = []
      let summary = ""

      const isWorkerSupportedTool = [
        "merge-pdf", "organize-pdf", "split-pdf", "rotate-pdf", "crop-pdf",
        "compress-pdf", "protect-pdf", "unlock-pdf", "watermark-pdf", "sign-pdf", "bates-pdf"
      ].includes(activeToolId)

      const executionConfig = {
        ...sandboxConfig,
        pageRotations,
        watermarkText: watermarkText || sandboxConfig.watermarkText,
        showWatermark: activeToolId === "watermark-pdf" ? true : sandboxConfig.showWatermark,
        showSignature: activeToolId === "sign-pdf" ? true : sandboxConfig.showSignature,
        showBates: activeToolId === "bates-pdf" ? true : sandboxConfig.showBates,
      }

      if (isWorkerSupportedTool && typeof window !== "undefined" && window.Worker) {
        try {
          resultOutputs = await executeInWorker(activeToolId, uploadedFiles, toolSettings, executionConfig)
          summary = `${activeTool.name} completed successfully.`
        } catch (workerErr) {
          console.warn("Background worker failed, using main thread fallback...", workerErr)
          const result = await processTool(activeTool, uploadedFiles, toolSettings, executionConfig)
          resultOutputs = result.outputs
          summary = result.summary
        }
      } else {
        const result = await processTool(activeTool, uploadedFiles, toolSettings, executionConfig)
        resultOutputs = result.outputs
        summary = result.summary
      }

      setProcessProgress(100)
      setOutputs(resultOutputs)
      setProcessLog(summary)
      setSuccessState(true)
    } catch (err) {
      setProcessLog(`Execution error: ${(err as Error)?.message || "Failed to process files."}`)
    } finally {
      setProcessing(false)
    }
  }

  const downloadOutput = (out: ToolOutput) => {
    const url = URL.createObjectURL(out.blob)
    const a = document.createElement("a")
    a.href = url
    a.download = out.name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#050605] text-zinc-100 flex flex-col pt-14 pb-12">
      
      {/* Tool Header Navigation Bar */}
      <div className="border-b border-[#202220] bg-[#0d0e0d]/80 px-4 sm:px-8 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-zinc-400 hover:text-cyan-400 transition"
            >
              ← Back to All Tools
            </Link>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                {activeTool.name}
              </span>
              <span className="rounded-full bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                {activeTool.category}
              </span>
            </div>
          </div>

          {/* Quick Select Tool Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hidden sm:inline">
              Switch Tool:
            </label>
            <select
              value={activeToolId}
              onChange={(e) => {
                setActiveToolId(e.target.value)
                setUploadedFiles([])
                setOutputs([])
                setSuccessState(false)
              }}
              className="h-8 border border-[#202220] bg-[#050605] text-xs text-white rounded-lg px-3 outline-none focus:border-cyan-400 cursor-pointer"
            >
              {toolRegistry.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (iLovePDF Style Split: Canvas + Sidebar) */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex flex-col lg:flex-row gap-6">
        
        {/* ========================================== */}
        {/* LEFT/CENTER AREA: Document Canvas / Dropzone */}
        {/* ========================================== */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* SPECIAL CASE: Document Editor Tool */}
          {activeToolId === "editor" ? (
            <div className="flex-1 flex flex-col items-center">
              <WordEditor
                editorRef={editorRef}
                onInsertImage={(f) => setUploadedFiles(prev => [...prev, f])}
                wordCount={wordCount}
                pageCount={pageCount}
                onPageCountChange={setPageCount}
                watermarkText={watermarkText}
                showPageNumbers={showPageNumbers}
                setShowPageNumbers={setShowPageNumbers}
                margins={margins}
                setMargins={setMargins}
                orientation={orientation}
                setOrientation={setOrientation}
                pageSize={pageSize}
                setPageSize={setPageSize}
                docTitle={documents.find(d => d.id === activeDocId)?.title || "Untitled Document"}
                onRenameDoc={(title) => {
                  setDocuments(prev => prev.map(d => d.id === activeDocId ? { ...d, title } : d))
                }}
              />
            </div>
          ) : (
            /* STANDARD FILE UTILITIES WORKSPACE FLOW */
            <div className="flex-1 flex flex-col min-h-[500px]">
              
              {/* SUCCESS DOWNLOAD STATE */}
              {successState && outputs.length > 0 ? (
                <div className="flex-1 rounded-2xl border border-cyan-500/30 bg-[#0d0e0d] p-8 sm:p-12 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 mb-6 shadow-xl shadow-cyan-950/50">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {activeTool.name} Task Completed!
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                    Your output files have been generated completely inside browser memory with zero network transit.
                  </p>

                  {/* Primary Download Button */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                    {outputs.map((out) => (
                      <button
                        key={out.id}
                        onClick={() => downloadOutput(out)}
                        className="flex items-center gap-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#050605] px-8 py-4 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
                      >
                        <Download className="h-5 w-5" />
                        <span>Download {out.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Secondary Action Shortcuts */}
                  <div className="mt-12 pt-8 border-t border-[#202220] w-full max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-3">
                      Continue with another PDF Tool:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                      <button
                        onClick={() => {
                          // Pass outputs as new uploaded files for continuous workflow
                          if (outputs.length > 0) {
                            const chainedFiles = outputs.map(o => new File([o.blob], o.name, { type: o.type }))
                            setUploadedFiles(chainedFiles)
                            setActiveToolId("compress-pdf")
                            setSuccessState(false)
                            setOutputs([])
                          }
                        }}
                        className="rounded-lg border border-[#202220] bg-[#181918] px-3 py-2 text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/30 transition font-semibold"
                      >
                        Compress Result →
                      </button>

                      <button
                        onClick={() => {
                          if (outputs.length > 0) {
                            const chainedFiles = outputs.map(o => new File([o.blob], o.name, { type: o.type }))
                            setUploadedFiles(chainedFiles)
                            setActiveToolId("protect-pdf")
                            setSuccessState(false)
                            setOutputs([])
                          }
                        }}
                        className="rounded-lg border border-[#202220] bg-[#181918] px-3 py-2 text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/30 transition font-semibold"
                      >
                        Protect with Password →
                      </button>

                      <button
                        onClick={() => {
                          setUploadedFiles([])
                          setOutputs([])
                          setSuccessState(false)
                        }}
                        className="rounded-lg border border-[#202220] bg-[#181918] px-3 py-2 text-zinc-400 hover:text-white transition font-semibold"
                      >
                        Restart Tool
                      </button>
                    </div>
                  </div>
                </div>
              ) : uploadedFiles.length === 0 ? (
                /* STAGE 1: PROMINENT DROPZONE (iLovePDF Style) */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex-1 rounded-2xl border-2 border-dashed p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[420px]",
                    isDragOver
                      ? "border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-950/30"
                      : "border-[#202220] bg-[#0d0e0d] hover:border-cyan-500/50 hover:bg-[#111311]"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
                    className="hidden"
                  />

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#181918] border border-[#202220] text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8" />
                  </div>

                  {/* Giant Action Button */}
                  <button
                    type="button"
                    className="rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#050605] px-8 py-4 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
                  >
                    Select {activeTool.acceptedFileTypes.includes("application/pdf") ? "PDF" : "Document"} Files
                  </button>

                  <p className="mt-4 text-xs text-zinc-400">
                    or drop files here directly from your desktop
                  </p>

                  {/* Cloud Import Badges */}
                  <div className="mt-8 flex items-center gap-3 pt-6 border-t border-[#202220]/60 text-zinc-500 text-[11px]">
                    <span className="flex items-center gap-1.5 hover:text-zinc-300 transition">
                      <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Google Drive</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 hover:text-zinc-300 transition">
                      <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Dropbox</span>
                    </span>
                    <span>•</span>
                    <span className="text-cyan-400/80 font-bold">
                      100% Client-Side Sandbox
                    </span>
                  </div>
                </div>
              ) : (
                /* STAGE 2: MULTI-FILE & PAGE PREVIEW CANVAS */
                <div className="flex-1 flex flex-col rounded-2xl border border-[#202220] bg-[#0d0e0d] p-6">
                  
                  {/* Top Toolbar for Canvas */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#202220] mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Selected Files ({uploadedFiles.length})
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 rounded-full bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5">
                        {(uploadedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB Total
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-950/60 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Files</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setUploadedFiles([]); setPageRotations({}) }}
                        className="text-xs text-zinc-500 hover:text-red-400 transition"
                      >
                        Clear All
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
                      className="hidden"
                    />
                  </div>

                  {/* Thumbnail Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[500px] pr-1">
                    {uploadedFiles.map((file, idx) => {
                      const angle = pageRotations[idx] || 0
                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="group relative flex flex-col justify-between rounded-xl border border-[#202220] bg-[#141514] p-4 transition-all hover:border-cyan-500/50 hover:shadow-lg"
                        >
                          {/* File Header & Index badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold">
                              {idx + 1}
                            </span>

                            {/* Rotation & Remove Controls */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => rotateFile(idx, 90)}
                                className="text-zinc-400 hover:text-cyan-400 p-1"
                                title="Rotate 90°"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="text-zinc-400 hover:text-red-400 p-1"
                                title="Remove File"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* File Visual Thumbnail Mockup */}
                          <div className="flex-1 flex flex-col items-center justify-center py-6 border border-[#202220] rounded-lg bg-[#0d0e0d] mb-3 transition-transform" style={{ transform: `rotate(${angle}deg)` }}>
                            <FileText className="h-10 w-10 text-cyan-400/80 mb-2" />
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              {file.name.split('.').pop() || 'PDF'}
                            </span>
                          </div>

                          {/* File Metadata */}
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <span className="text-[10px] font-mono text-zinc-500 block">
                              {(file.size / 1024).toFixed(1)} KB {angle > 0 ? `• ${angle}° Rotated` : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>
              )}

            </div>
          )}

        </main>

        {/* ========================================== */}
        {/* RIGHT SIDEBAR PANEL: Tool Options Drawer    */}
        {/* ========================================== */}
        <aside className="w-full lg:w-[340px] shrink-0 flex flex-col">
          <div className="sticky top-20 rounded-2xl border border-[#202220] bg-[#0d0e0d] p-6 space-y-6">
            
            {/* Header / Tool Info */}
            <div className="border-b border-[#202220] pb-4">
              <h3 className="text-lg font-black text-white">
                {activeTool.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {activeTool.description}
              </p>
            </div>

            {/* Dynamic Options Form Fields */}
            {activeTool.settingsSchema.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Tool Settings
                </span>

                {activeTool.settingsSchema.map(setting => (
                  <div key={setting.name} className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block">
                      {setting.label}
                    </label>

                    {setting.type === "password" ? (
                      <input
                        type="password"
                        value={String(toolSettings[setting.name] ?? setting.defaultValue)}
                        onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: e.target.value }))}
                        placeholder="Enter password..."
                        className="w-full rounded-xl border border-[#202220] bg-[#050605] py-2.5 px-3 text-xs text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                      />
                    ) : setting.type === "select" ? (
                      <select
                        value={String(toolSettings[setting.name] ?? setting.defaultValue)}
                        onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: e.target.value }))}
                        className="w-full rounded-xl border border-[#202220] bg-[#050605] py-2.5 px-3 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        {setting.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : setting.type === "slider" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={setting.min}
                          max={setting.max}
                          step={setting.step || 1}
                          value={Number(toolSettings[setting.name] ?? setting.defaultValue)}
                          onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: Number(e.target.value) }))}
                          className="flex-1 accent-cyan-400 h-1.5 rounded-lg bg-[#202220]"
                        />
                        <span className="font-mono text-cyan-400 font-bold text-xs w-8 text-right">
                          {String(toolSettings[setting.name] ?? setting.defaultValue)}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={String(toolSettings[setting.name] ?? setting.defaultValue)}
                        onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: e.target.value }))}
                        className="w-full rounded-xl border border-[#202220] bg-[#050605] py-2.5 px-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Special Action Controls (Watermark Sandbox / Signature) */}
            {(activeToolId === "watermark-pdf" || activeToolId === "sign-pdf") && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSandboxOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 transition"
                >
                  <Minimize className="h-4 w-4 text-cyan-400 rotate-45" />
                  <span>Interactive Visual Layout Sandbox</span>
                </button>
              </div>
            )}

            {/* GIANT PRIMARY ACTION BUTTON (iLovePDF Style Sticky Action) */}
            <div className="pt-4 border-t border-[#202220]">
              <button
                type="button"
                onClick={handleExecute}
                disabled={processing || (uploadedFiles.length === 0 && activeToolId !== "word-to-pdf" && activeToolId !== "editor")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-[#050605] py-4 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-[#050605]" />
                    <span>Processing {processProgress}%...</span>
                  </>
                ) : (
                  <>
                    <span>{activeTool.name}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {processLog && (
                <p className="mt-3 text-[11px] font-mono text-zinc-400 text-center leading-relaxed">
                  {processLog}
                </p>
              )}
            </div>

            {/* Local Privacy Commitment Tag */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-center">
              <span className="text-[10px] text-cyan-400 font-bold block">
                🔒 100% Client-Side Sandbox
              </span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">
                Files stay in browser RAM. Zero server uploads.
              </span>
            </div>

          </div>
        </aside>

      </div>

      {/* Visual Placement Layout Sandbox Modal */}
      <LayoutSandbox
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        onSave={(newConfig) => setSandboxConfig(newConfig)}
        initialConfig={{
          ...sandboxConfig,
          watermarkText: watermarkText || sandboxConfig.watermarkText
        }}
        pageCount={uploadedFiles.length || 1}
      />

    </div>
  )
}
