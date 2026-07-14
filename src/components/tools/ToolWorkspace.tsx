'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { 
  Trash2, FolderPlus, Download, RefreshCw,
  PenTool, Minimize,
  Play, Cloud, Smartphone, Monitor,
  Trash, Camera
} from "lucide-react"
import WordEditor from "./WordEditor"
import { toolRegistry, type ToolSettings } from "@/lib/tools/registry"
import { processTool, type ToolOutput } from "@/lib/tools/processors"
import LayoutSandbox, { type SandboxConfig } from "./LayoutSandbox"

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
  },
  {
    id: "template-contract",
    title: "NDA Legal Agreement",
    content: `<h1 style="font-family:'Geist Sans';font-size:20pt;color:#22d3ee;text-align:center;margin:0 0 24px;font-weight:bold;">MUTUAL NON-DISCLOSURE AGREEMENT</h1>
              <p style="font-size:10pt;color:#e4e4e7;line-height:1.7;">This Mutual Non-Disclosure Agreement ("Agreement") is entered into this day by and between the Undersigned Parties for the purpose of preventing the unauthorized disclosure of Confidential Information shared during joint development sessions.</p>
              <p style="font-size:10pt;color:#e4e4e7;line-height:1.7;margin-top:12px;"><strong>1. Definition of Confidential Information.</strong> Confidential Information includes all proprietary formulas, file encryption schemas, and local-first browser architectures disclosed under the Gauss security lab protocol.</p>`
  }
]

interface DocumentRecord {
  id: string
  title: string
  content: string
  updatedAt: string
}

export default function ToolWorkspace({ toolId: initialToolId }: { toolId: string }) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Core Active tool selections
  const [activeToolId, setActiveToolId] = useState(initialToolId || "editor")
  const activeTool = useMemo(() => toolRegistry.find(t => t.id === activeToolId) || toolRegistry[0], [activeToolId])

  // Left Sidebar panel tabs
  const [leftTab, setLeftTab] = useState<"docs" | "workflows" | "cloud" | "simulators" | "api">("docs")

  // Documents list states (saved to localStorage)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [activeDocId, setActiveDocId] = useState("")

  // Device Simulator wrapper layout configurations
  const [deviceWrapper, setDeviceWrapper] = useState<"none" | "macos" | "windows" | "iphone" | "android">("none")

  // PDF settings & upload hooks
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [toolSettings, setToolSettings] = useState<ToolSettings>({})
  const [processing, setProcessing] = useState(false)
  const [outputs, setOutputs] = useState<ToolOutput[]>([])
  const [processLog, setProcessLog] = useState("")

  // Interactive layout sandbox editor state
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>({
    watermarkText: "DRAFT",
    watermarkX: 180,
    watermarkY: 420,
    watermarkSize: 64,
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

  // Interactive signature drawing pad modal state
  const [sigModalOpen, setSigModalOpen] = useState(false)
  const [sigPoints, setSigPoints] = useState<{ x: number; y: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const sigCanvasRef = useRef<HTMLCanvasElement>(null)

  // Document formatting configurations
  const [watermarkText, setWatermarkText] = useState("")
  const [showPageNumbers, setShowPageNumbers] = useState(true)
  const [margins, setMargins] = useState("normal")
  const [orientation, setOrientation] = useState<"Portrait" | "Landscape">("Portrait")
  const [pageSize, setPageSize] = useState<"A4" | "Letter" | "Legal">("A4")

  // Simulated AI panels
  const [aiReport, setAiReport] = useState<{ summary: string; bullets: string[]; stats: string } | null>(null)
  const [aiChatQuery, setAiChatQuery] = useState("")
  const [aiChatLogs, setAiChatLogs] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Offline Gauss AI Assistant ready. Ask me to summarize, extract key metadata terms, or rewrite selected document content." }
  ])

  // Custom Workflows stack list
  const [workflowStack, setWorkflowStack] = useState<string[]>(["merge-pdf", "watermark-pdf", "protect-pdf"])
  const [workflowLog, setWorkflowLog] = useState<string[]>([])
  const [workflowRunning, setWorkflowRunning] = useState(false)

  // Cloud backup sync simulators logs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cloudSyncedFiles, setCloudSyncedFiles] = useState<string[]>([])
  const [gdriveConnected, setGdriveConnected] = useState(false)
  const [dropboxConnected, setDropboxConnected] = useState(false)
  const [syncLogs, setSyncLogs] = useState<string[]>(["Local environment ready. Connection initialized."])

  // Camera stream simulator (Scan to PDF)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cameraActive, setCameraActive] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [capturedScans, setCapturedScans] = useState<string[]>([])

  // Visual document stats counter
  const [wordCount, setWordCount] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [charCount, setCharCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  // 1. Initial Load Documents from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gauss-docs")
      if (saved) {
        const parsed = JSON.parse(saved)
        setDocuments(parsed)
        if (parsed.length > 0) {
          setActiveDocId(parsed[0].id)
        }
      } else {
        // Preload templates
        const initialDocs = DOCUMENT_TEMPLATES.map(t => ({
          id: t.id,
          title: t.title,
          content: t.content,
          updatedAt: new Date().toISOString()
        }))
        setDocuments(initialDocs)
        setDocumentsInStorage(initialDocs)
        setActiveDocId("template-blank")
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const setDocumentsInStorage = (docs: DocumentRecord[]) => {
    localStorage.setItem("gauss-docs", JSON.stringify(docs))
  }

  // 2. Switch Documents and render text content inside contentEditable
  useEffect(() => {
    const activeDoc = documents.find(d => d.id === activeDocId)
    if (activeDoc && editorRef.current) {
      editorRef.current.innerHTML = activeDoc.content
      updateStats()
    }
  }, [activeDocId, documents])

  // 3. Save Active Editor Content to Local DB
  const saveCurrentDoc = () => {
    if (!editorRef.current || !activeDocId) return
    const content = editorRef.current.innerHTML
    const updatedDocs = documents.map(d => {
      if (d.id === activeDocId) {
        return { ...d, content, updatedAt: new Date().toISOString() }
      }
      return d
    })
    setDocuments(updatedDocs)
    setDocumentsInStorage(updatedDocs)
    addSyncLog("Autosaved document to local database.")
  }

  // 4. Update stats (Word count & character count)
  const updateStats = () => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ""
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
    setCharCount(text.length)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentDoc()
      updateStats()
    }, 4000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId, documents])

  // 5. Add Document or load Template
  const createNewDoc = (templateId?: string) => {
    const template = DOCUMENT_TEMPLATES.find(t => t.id === templateId) || DOCUMENT_TEMPLATES[0]
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      title: templateId ? `Copy of ${template.title}` : "Untitled Document",
      content: template.content,
      updatedAt: new Date().toISOString()
    }
    const updated = [newDoc, ...documents]
    setDocuments(updated)
    setDocumentsInStorage(updated)
    setActiveDocId(newDoc.id)
    addSyncLog(`Created new document from template: ${newDoc.title}`)
  }

  const deleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const filtered = documents.filter(d => d.id !== id)
    setDocuments(filtered)
    setDocumentsInStorage(filtered)
    if (activeDocId === id && filtered.length > 0) {
      setActiveDocId(filtered[0].id)
    }
    addSyncLog("Deleted document profile.")
  }

  // 6. Signature Pad Canvas event loops
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    setSigPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = sigCanvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setSigPoints(prev => [...prev, newPoint])

    ctx.strokeStyle = "#22d3ee"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    ctx.beginPath()
    const last = sigPoints[sigPoints.length - 1]
    if (last) {
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(newPoint.x, newPoint.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = sigCanvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setSigPoints([])
    }
  }

  const saveSignature = () => {
    const canvas = sigCanvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      // Insert visual signature block stamp into editor
      editorRef.current?.focus()
      const html = `<img src="${dataUrl}" style="width:120px;height:45px;border-bottom:1px solid #444;margin:8px;" class="signature-stamp"/>`
      document.execCommand("insertHTML", false, html)
      setSigModalOpen(false)
      addSyncLog("Inserted typed signature signature stamp.")
    }
  }

  // Web Worker execution function
  const executeInWorker = (toolId: string, files: File[], settings: ToolSettings, config?: any): Promise<ToolOutput[]> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url))
        
        worker.onmessage = async (e) => {
          if (e.data.success) {
            const outBlob = new Blob([e.data.buffer], { type: "application/pdf" })
            const name = toolId === "merge-pdf" ? "merged.pdf" 
                         : toolId === "split-pdf" ? "split.pdf"
                         : toolId === "watermark-pdf" ? "watermarked.pdf"
                         : "processed.pdf"
            const output: ToolOutput = {
              id: crypto.randomUUID(),
              name,
              type: outBlob.type,
              size: outBlob.size,
              blob: outBlob,
              message: `Completed via background worker. ${e.data.pageCount || 1} pages.`
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

  // 7. Execute PDF Action (Local Processing)
  const handleExecuteAction = async () => {
    setProcessing(true)
    setProcessLog("Reading files from sandbox memory...")
    try {
      let finalFiles = [...uploadedFiles]
      
      // If converting active document to PDF: use browser print for fidelity
      if (activeToolId === "word-to-pdf") {
        window.print()
        setProcessLog("COMPLETED: Print dialog opened. Use your browser's print-to-PDF option to save the document.")
        setProcessing(false)
        return
      }

      let resultOutputs: ToolOutput[] = []
      let summary = ""
      
      const isPdfWorkerTool = [
        "merge-pdf", "split-pdf", "rotate-pdf", "crop-pdf",
        "compress-pdf", "protect-pdf", "unlock-pdf", "watermark-pdf", "sign-pdf"
      ].includes(activeToolId)

      if (isPdfWorkerTool && typeof window !== "undefined" && window.Worker) {
        setProcessLog("Offloading intensive task to local background thread...")
        try {
          const workerConfig = {
            ...sandboxConfig,
            watermarkText: watermarkText || sandboxConfig.watermarkText,
            showWatermark: activeToolId === "watermark-pdf" ? true : sandboxConfig.showWatermark,
            showSignature: activeToolId === "sign-pdf" ? true : sandboxConfig.showSignature,
            showBates: activeToolId === "bates-pdf" ? true : sandboxConfig.showBates,
          }
          resultOutputs = await executeInWorker(activeToolId, finalFiles, toolSettings, workerConfig)
          summary = `${activeTool.name} completed successfully on Web Worker thread.`
        } catch (workerErr) {
          console.warn("Background thread failed, falling back to main UI thread...", workerErr)
          setProcessLog("Worker failed, falling back to main UI thread...")
          const result = await processTool(activeTool, finalFiles, {
            ...toolSettings,
            watermarkText
          }, sandboxConfig)
          resultOutputs = result.outputs
          summary = result.summary
        }
      } else {
        const result = await processTool(activeTool, finalFiles, {
          ...toolSettings,
          watermarkText
        }, sandboxConfig)
        resultOutputs = result.outputs
        summary = result.summary
      }

      setOutputs(resultOutputs)
      setProcessLog(`COMPLETED: ${summary}`)
      
      // If converted PDF to Word, parse text content back to Word editor
      if (activeToolId === "pdf-to-word" && resultOutputs.length > 0) {
        const text = await resultOutputs[0].blob.text()
        if (editorRef.current) {
          editorRef.current.innerHTML = `<h1>Converted PDF Content</h1><p style="color:#22d3ee;font-weight:bold;">Successfully imported from ${resultOutputs[0].name}</p><div style="margin-top:16px;">${text}</div>`
          updateStats()
        }
      }

      // If workflow chains, mirror backup
      triggerSyncMirror(resultOutputs.map(o => o.name))

    } catch (e) {
      setProcessLog(`ERROR: ${(e as Error)?.message || "Execution failed."}`)
    }
    setProcessing(false)
  }

  // 8. Custom Workflows pipeline execution
  const runChainedWorkflow = async () => {
    if (uploadedFiles.length === 0) {
      setWorkflowLog(["Error: Upload a base document file to feed the custom chain."])
      return
    }
    setWorkflowRunning(true)
    setWorkflowLog(["Initializing Chain Workspace Pipeline..."])
    
    let currentInput = [...uploadedFiles]
    
    for (let i = 0; i < workflowStack.length; i++) {
      const stepToolId = workflowStack[i]
      const stepTool = toolRegistry.find(t => t.id === stepToolId)
      if (!stepTool) continue
      
      setWorkflowLog(prev => [...prev, `[Step ${i+1}/${workflowStack.length}] Running operational filter: ${stepTool.name}...`])
      
      try {
        const result = await processTool(stepTool, currentInput, { watermarkText })
        if (result.outputs.length > 0) {
          // Feed outputs as inputs to next step
          currentInput = result.outputs.map(o => new File([o.blob], o.name, { type: o.type }))
          setWorkflowLog(prev => [...prev, `  ✓ Done. Generated output: ${result.outputs[0].name}`])
        }
      } catch (err) {
        setWorkflowLog(prev => [...prev, `  ❌ Error in step ${stepTool.name}: ${(err as Error)?.message || String(err)}`])
        setWorkflowRunning(false)
        return
      }
    }

    setWorkflowLog(prev => [...prev, "✓ Pipeline completed! Preparing download headers..."])
    
    // Final output save
    const finalOutputs = await Promise.all(currentInput.map(async f => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type,
      size: f.size,
      blob: new Blob([await f.arrayBuffer()], { type: f.type }),
      message: "Chained compile complete."
    })))
    
    setOutputs(finalOutputs)
    setWorkflowRunning(false)
    triggerSyncMirror(finalOutputs.map(o => o.name))
  }

  // 9. Sync & Mirror Backup Simulators
  const triggerSyncMirror = (names: string[]) => {
    if (!gdriveConnected && !dropboxConnected) return
    names.forEach(name => {
      const target = gdriveConnected ? "Google Drive" : "Dropbox"
      setCloudSyncedFiles(prev => [name, ...prev])
      addSyncLog(`Mirrored upload files [${name}] to backup repository node in ${target}.`)
    })
  }

  const addSyncLog = (msg: string) => {
    setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)])
  }

  // 10. AI Summarizer side module
  const runAISummary = () => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText
    
    // Heuristics summary builder client side
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10)
    const bulletTakeaways = sentences.slice(0, 3).map(s => s.length > 80 ? s.substring(0, 80) + "..." : s)
    
    setAiReport({
      summary: text.substring(0, 240) + "...",
      bullets: bulletTakeaways.length > 0 ? bulletTakeaways : ["Document contains short paragraphs", "No complex structures parsed."],
      stats: `Word Count: ${wordCount} | Complexity Index: Medium | Ideal Reading Audience: Office Corporate Managers`
    })
    addSyncLog("Compiled offline AI Summarization report details.")
  }

  const sendAIChatMsg = () => {
    if (!aiChatQuery.trim()) return
    const userMsg = aiChatQuery
    setAiChatLogs(prev => [...prev, { role: "user", text: userMsg }])
    setAiChatQuery("")
    
    setTimeout(() => {
      let reply = "I analyzed your document locally. "
      if (userMsg.toLowerCase().includes("summar")) {
        reply += `Here is a quick summary: The document titled "${documents.find(d => d.id === activeDocId)?.title || "Untitled"}" details local document frameworks with ${wordCount} words.`
      } else if (userMsg.toLowerCase().includes("translate")) {
        reply += "You can use the Translate panel in the PDF Actions sidebar to stamp a translation layer (Thai/Japanese) onto A4 pages."
      } else {
        reply += "I can identify heading blocks, extract signature coordinates, or format redaction layers locally with zero server requests."
      }
      setAiChatLogs(prev => [...prev, { role: "assistant", text: reply }])
    }, 800)
  }

  // 11. Camera scanner emulator
  const triggerCameraScan = () => {
    setCameraActive(true)
    setTimeout(() => {
      const canvas = document.createElement("canvas")
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, 640, 480)
        ctx.strokeStyle = "#22d3ee"
        ctx.lineWidth = 4
        ctx.strokeRect(30, 30, 580, 420)
        ctx.fillStyle = "#1e293b"
        ctx.font = "bold 24px sans-serif"
        ctx.fillText("GAUSS SCANNED DOCUMENT", 120, 160)
        ctx.font = "14px monospace"
        ctx.fillText(`Timestamp: ${new Date().toLocaleString()}`, 120, 200)
        ctx.fillText("Camera scanner perspective corrected.", 120, 230)
      }
      const data = canvas.toDataURL("image/jpeg")
      setCapturedScans(prev => [data, ...prev])
      
      // Convert to file
      fetch(data)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" })
          setUploadedFiles(prev => [...prev, file])
        })

      setCameraActive(false)
      addSyncLog("Captured scanner stream frame successfully.")
    }, 1500)
  }

  // 12. Drag & Drop Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files || [])])
      setOutputs([])
    }
  }

  const renameActiveDoc = (newTitle: string) => {
    const updated = documents.map(d => {
      if (d.id === activeDocId) {
        return { ...d, title: newTitle, updatedAt: new Date().toISOString() }
      }
      return d
    })
    setDocuments(updated)
    setDocumentsInStorage(updated)
  }

  const renderWordEditor = (overrides?: { margins?: string; orientation?: "Portrait" | "Landscape"; pageSize?: "A4" | "Letter" | "Legal" }) => {
    const activeDoc = documents.find(d => d.id === activeDocId)
    return (
      <WordEditor 
        editorRef={editorRef} 
        onInsertImage={(f) => setUploadedFiles(prev => [...prev, f])}
        wordCount={wordCount}
        pageCount={pageCount}
        onPageCountChange={setPageCount}
        watermarkText={watermarkText}
        setWatermarkText={setWatermarkText}
        showPageNumbers={showPageNumbers}
        setShowPageNumbers={setShowPageNumbers}
        margins={overrides?.margins || margins}
        setMargins={setMargins}
        orientation={overrides?.orientation || orientation}
        setOrientation={setOrientation}
        pageSize={overrides?.pageSize || pageSize}
        setPageSize={setPageSize}
        docTitle={activeDoc?.title || "Untitled Document"}
        onRenameDoc={renameActiveDoc}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#070807] text-white flex flex-col pt-16">
      
      {/* Dynamic Device Simulator chassis wrapper */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================== */}
        {/* A. LEFT SIDEBAR PANEL (Extensions Suite)   */}
        {/* ========================================== */}
        <aside className="w-[300px] shrink-0 border-r border-zinc-900 bg-zinc-950 flex flex-col select-none">
          {/* Tab Navigation header */}
          <div className="grid grid-cols-5 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold">
            <button onClick={() => setLeftTab("docs")} className={`py-3 border-b-2 transition ${leftTab === "docs" ? "border-cyan-400 text-white bg-zinc-900/40" : "border-transparent hover:text-zinc-200"}`}>Files</button>
            <button onClick={() => setLeftTab("workflows")} className={`py-3 border-b-2 transition ${leftTab === "workflows" ? "border-cyan-400 text-white bg-zinc-900/40" : "border-transparent hover:text-zinc-200"}`}>Flows</button>
            <button onClick={() => setLeftTab("cloud")} className={`py-3 border-b-2 transition ${leftTab === "cloud" ? "border-cyan-400 text-white bg-zinc-900/40" : "border-transparent hover:text-zinc-200"}`}>Cloud</button>
            <button onClick={() => setLeftTab("simulators")} className={`py-3 border-b-2 transition ${leftTab === "simulators" ? "border-cyan-400 text-white bg-zinc-900/40" : "border-transparent hover:text-zinc-200"}`}>Preview</button>
            <button onClick={() => setLeftTab("api")} className={`py-3 border-b-2 transition ${leftTab === "api" ? "border-cyan-400 text-white bg-zinc-900/40" : "border-transparent hover:text-zinc-200"}`}>API</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* Tab: Docs Explorer */}
            {leftTab === "docs" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Document profiles</span>
                  <button onClick={() => createNewDoc()} className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-bold transition">
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span>New Blank</span>
                  </button>
                </div>
                
                {/* List of documents */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs border transition cursor-pointer select-none ${
                        activeDocId === doc.id 
                          ? "bg-cyan-500/10 border-cyan-400/30 text-white" 
                          : "border-transparent bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900"
                      }`}
                    >
                      <span className="truncate font-semibold">{doc.title}</span>
                      <button onClick={(e) => deleteDoc(doc.id, e)} className="text-zinc-600 hover:text-red-400 transition p-1">
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-900 pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Create from template</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button onClick={() => createNewDoc("template-resume")} className="px-2 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition font-semibold text-zinc-300">Resume Doc</button>
                    <button onClick={() => createNewDoc("template-proposal")} className="px-2 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition font-semibold text-zinc-300">Proposal</button>
                    <button onClick={() => createNewDoc("template-contract")} className="px-2 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition font-semibold text-zinc-300">NDA Contract</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Custom Workflows Chain Builder */}
            {leftTab === "workflows" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Workflow Stack Chain</span>
                  <button onClick={() => setWorkflowStack([])} className="text-[10px] text-zinc-500 hover:text-white transition">Clear</button>
                </div>
                
                {/* Drag and drop stacked cards */}
                <div className="space-y-2">
                  {workflowStack.map((toolId, i) => {
                    const t = toolRegistry.find(x => x.id === toolId)
                    if (!t) return null
                    return (
                      <div key={i} className="flex items-center justify-between border border-zinc-800 bg-zinc-900/40 rounded-xl p-2.5 text-xs">
                        <span className="font-semibold text-zinc-300">{i + 1}. {t.name}</span>
                        <button
                          onClick={() => setWorkflowStack(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-zinc-600 hover:text-red-400 p-0.5 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                  
                  {workflowStack.length === 0 && (
                    <p className="text-[11px] text-zinc-600 text-center py-6">Chain stack is empty. Click presets below to load pipeline.</p>
                  )}
                </div>

                {/* Preset actions add */}
                <div className="border-t border-zinc-900 pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Quick Preset Nodes</span>
                  <div className="flex gap-2 flex-wrap text-[9px] font-bold uppercase">
                    <button onClick={() => setWorkflowStack(["ocr-pdf", "watermark-pdf", "protect-pdf"])} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 text-cyan-300 transition">Legal Audit Flow</button>
                    <button onClick={() => setWorkflowStack(["merge-pdf", "compress-pdf"])} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 text-cyan-300 transition">Merge & Compress</button>
                  </div>
                </div>

                {/* Execution panel workflow */}
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3 space-y-3">
                  <button
                    onClick={runChainedWorkflow}
                    disabled={workflowRunning}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-400 text-zinc-950 font-black text-xs uppercase transition tracking-wider disabled:opacity-50"
                  >
                    {workflowRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    <span>Execute Workflow Chain</span>
                  </button>

                  <div className="space-y-1.5 text-[9px] font-mono text-zinc-500 max-h-[140px] overflow-y-auto pr-1">
                    {workflowLog.map((log, idx) => (
                      <div key={idx} className="truncate">{log}</div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab: Cloud Synced backup dashboard */}
            {leftTab === "cloud" && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Cloud Integrations</span>
                
                {/* Connector buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => { setGdriveConnected(!gdriveConnected); addSyncLog(gdriveConnected ? "Disconnected Google Drive." : "Connected Google Drive repository.") }}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl transition text-xs font-semibold ${
                      gdriveConnected ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300" : "border-zinc-800 hover:border-zinc-700 text-zinc-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      <span>Google Drive Cloud Sync</span>
                    </span>
                    <span className="text-[9px] font-bold">{gdriveConnected ? "SYNCED" : "OFFLINE"}</span>
                  </button>

                  <button
                    onClick={() => { setDropboxConnected(!dropboxConnected); addSyncLog(dropboxConnected ? "Disconnected Dropbox." : "Connected Dropbox repository.") }}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl transition text-xs font-semibold ${
                      dropboxConnected ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300" : "border-zinc-800 hover:border-zinc-700 text-zinc-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      <span>Dropbox Repository Mirror</span>
                    </span>
                    <span className="text-[9px] font-bold">{dropboxConnected ? "SYNCED" : "OFFLINE"}</span>
                  </button>
                </div>

                {/* Synced files logs */}
                <div className="border-t border-zinc-900 pt-3 space-y-2 font-mono text-[9px] text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Cloud Mirror Log</span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {syncLogs.map((log, idx) => <div key={idx}>{log}</div>)}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Simulators native chassis preview */}
            {leftTab === "simulators" && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Device Chassis Wrapper</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "none", label: "No Wrapper", icon: Minimize },
                    { id: "macos", label: "macOS Window", icon: Monitor },
                    { id: "windows", label: "Windows OS", icon: Monitor },
                    { id: "iphone", label: "iOS iPhone", icon: Smartphone },
                    { id: "android", label: "Android Mobile", icon: Smartphone }
                  ].map(dev => {
                    const Icon = dev.icon
                    return (
                      <button
                        key={dev.id}
                        onClick={() => { setDeviceWrapper(dev.id as "none" | "macos" | "windows" | "iphone" | "android"); addSyncLog(`Switched chassis layout view to: ${dev.label}`) }}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-left transition font-semibold ${
                          deviceWrapper === dev.id 
                            ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300" 
                            : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
                        <span>{dev.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab: API Playground for devs */}
            {leftTab === "api" && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Developer API Endpoint Console</span>
                
                <div className="space-y-3 font-mono text-[9px] text-zinc-400">
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                    <div className="text-cyan-400 font-bold uppercase tracking-widest">POST /api/v1/pdf/ocr</div>
                    <pre className="text-zinc-500 text-[8px] whitespace-pre-wrap">{`{
  "file": "base64_encoded_stream",
  "language": "eng+tha",
  "deskew": true
}`}</pre>
                  </div>

                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                    <div className="text-cyan-400 font-bold uppercase tracking-widest">POST /api/v1/pdf/encrypt</div>
                    <pre className="text-zinc-500 text-[8px] whitespace-pre-wrap">{`{
  "file": "base64_encoded_stream",
  "password": "user_key_secret"
}`}</pre>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-3 text-center text-zinc-500 text-[9px]">
                    🔐 Secure client-side tokens are cached locally in your browser workspace.
                  </div>
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* ========================================== */}
        {/* B. CENTRAL MAIN DOCS EDITOR                */}
        {/* ========================================== */}
        <main className="flex-1 flex flex-col bg-zinc-900/20 p-6 overflow-y-auto items-center justify-start">
          
          {/* Apply structural Device Simulator wrappers around WordEditor */}
          {deviceWrapper === "macos" && (
            <div className="w-full max-w-4xl border border-zinc-800 rounded-2xl bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-zinc-900 px-4 py-2 flex items-center gap-1.5 border-b border-zinc-800/60">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-zinc-500 ml-4 font-bold font-mono">gauss-studio.app</span>
              </div>
              {renderWordEditor()}
            </div>
          )}

          {deviceWrapper === "windows" && (
            <div className="w-full max-w-4xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-[#1e1e1e] px-4 py-2.5 flex items-center justify-between border-b border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-400 font-sans">Gauss local-first sandbox v2</span>
                <div className="flex gap-2">
                  <span className="w-3 h-0.5 bg-zinc-500 self-center" />
                  <span className="w-2.5 h-2.5 border border-zinc-500 block" />
                  <span className="text-zinc-500 text-xs">×</span>
                </div>
              </div>
              {renderWordEditor()}
            </div>
          )}

          {deviceWrapper === "iphone" && (
            <div className="w-[380px] border-[12px] border-zinc-800 rounded-[48px] bg-zinc-950 overflow-hidden shadow-2xl flex flex-col h-[750px] relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800" />
              </div>
              <div className="flex-1 overflow-y-auto pt-8">
                {renderWordEditor({ margins: "narrow", orientation: "Portrait", pageSize: "A4" })}
              </div>
            </div>
          )}

          {deviceWrapper === "android" && (
            <div className="w-[370px] border-[8px] border-zinc-850 rounded-[32px] bg-zinc-950 overflow-hidden shadow-2xl flex flex-col h-[720px] relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 rounded-full z-50" />
              <div className="flex-1 overflow-y-auto pt-6">
                {renderWordEditor({ margins: "narrow", orientation: "Portrait", pageSize: "A4" })}
              </div>
            </div>
          )}

          {deviceWrapper === "none" && (
            <div className="w-full max-w-4xl">
              {renderWordEditor()}
            </div>
          )}

        </main>

        {/* ========================================== */}
        {/* C. RIGHT SIDEBAR PANEL (PDF Tool Wizard)  */}
        {/* ========================================== */}
        <aside className="w-[320px] shrink-0 border-l border-zinc-900 bg-zinc-950 flex flex-col select-none">
          <div className="p-4 border-b border-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">PDF Action Wizard</span>
            
            <select
              value={activeToolId}
              onChange={(e) => {
                setActiveToolId(e.target.value)
                setOutputs([])
                setProcessLog("")
              }}
              className="w-full h-8 border border-zinc-800 bg-zinc-900 text-xs text-white rounded-lg px-2.5 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {toolRegistry.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            
            {/* Tool Description panel */}
            <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-xl space-y-1">
              <h4 className="font-bold text-cyan-300">{activeTool.name}</h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">{activeTool.description}</p>
            </div>

            {/* Uploaded Base Files Area */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Inputs / Uploads</span>
              
              <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 rounded-xl p-3.5 text-center cursor-pointer relative transition">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Download className="h-5 w-5 text-zinc-500 mx-auto mb-1.5" />
                <span className="text-[10px] text-zinc-400 block font-semibold">Drop PDF/image files here</span>
                <span className="text-[9px] text-zinc-650 block mt-0.5">Click to browse locally</span>
              </div>

              {/* Uploaded files array checklist */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-850 p-2 rounded-lg text-[10px]">
                      <span className="truncate max-w-[200px] text-zinc-300 font-mono font-medium">{file.name}</span>
                      <button 
                        onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-zinc-600 hover:text-red-400 transition"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic tool-specific wizard inputs */}
            {activeTool.settingsSchema.length > 0 && (
              <div className="space-y-3.5 border-t border-zinc-900 pt-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Configurations</span>
                {activeTool.settingsSchema.map(setting => (
                  <div key={setting.name} className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px] block">{setting.label}</label>
                    {setting.type === "password" ? (
                      <input
                        type="password"
                        value={String(toolSettings[setting.name] ?? setting.defaultValue)}
                        onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: e.target.value }))}
                        className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 outline-none focus:border-cyan-500 font-mono text-xs text-white"
                      />
                    ) : setting.type === "select" ? (
                      <select
                        value={String(toolSettings[setting.name] ?? setting.defaultValue)}
                        onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: e.target.value }))}
                        className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 outline-none focus:border-cyan-500 cursor-pointer text-xs text-zinc-300"
                      >
                        {setting.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : setting.type === "slider" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={setting.min}
                          max={setting.max}
                          value={Number(toolSettings[setting.name] ?? setting.defaultValue)}
                          onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: Number(e.target.value) }))}
                          className="flex-1 accent-cyan-400 h-1 rounded-lg bg-zinc-800"
                        />
                        <span className="font-mono text-zinc-400 w-8 text-right font-bold text-[10px]">
                          {String(toolSettings[setting.name] ?? setting.defaultValue)}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={String(toolSettings[setting.name] ?? setting.defaultValue)}
                        onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.name]: e.target.value }))}
                        className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 outline-none focus:border-cyan-500 text-xs text-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Visual Coordinate Layout Sandbox Button */}
            {(activeToolId === "watermark-pdf" || activeToolId === "sign-pdf") && (
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Preflight Placement Sandbox</span>
                <button
                  type="button"
                  onClick={() => setSandboxOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                >
                  <Minimize className="h-4 w-4 rotate-45 text-cyan-450" />
                  <span>Configure Visual Layout</span>
                </button>
              </div>
            )}

            {/* Special Action: Electronic Signatures Pad Button */}
            {activeToolId === "sign-pdf" && (
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Sign Stamp Designer</span>
                <button
                  onClick={() => setSigModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                >
                  <PenTool className="h-4 w-4" />
                  <span>Open Draw Signature Pad</span>
                </button>
              </div>
            )}

            {/* Special Action: Scan to PDF Emulator Frame */}
            {activeToolId === "scan-to-pdf" && (
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Camera scanner</span>
                <button
                  onClick={triggerCameraScan}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                >
                  <Camera className="h-4 w-4" />
                  <span>Simulate Scanner Capture</span>
                </button>
              </div>
            )}

            {/* Special Action: AI Summary and Translate Panel triggers */}
            {activeToolId === "ai-summarizer" && (
              <div className="border-t border-zinc-900 pt-3 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">AI Summary Module</span>
                
                <button
                  onClick={runAISummary}
                  className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-cyan-300 font-bold tracking-wider uppercase text-[10px] transition"
                >
                  Analyze Content Structure
                </button>

                {aiReport && (
                  <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl space-y-2 text-[10px]">
                    <div className="font-bold text-zinc-300">Executive Summary:</div>
                    <p className="text-zinc-500 italic">{aiReport.summary}</p>
                    
                    <div className="font-bold text-zinc-300 mt-2">Core Points:</div>
                    <ul className="list-disc pl-4 text-zinc-500 space-y-0.5">
                      {aiReport.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                    <div className="text-zinc-600 border-t border-zinc-900 pt-1.5 mt-1 font-mono text-[8px]">{aiReport.stats}</div>
                  </div>
                )}

                {/* AI Assistant chat helper */}
                <div className="border-t border-zinc-900 pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Ask Gauss AI</span>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-2.5 space-y-2 h-[120px] overflow-y-auto">
                    {aiChatLogs.map((log, idx) => (
                      <div key={idx} className={`leading-normal ${log.role === 'user' ? 'text-cyan-300 text-right font-bold' : 'text-zinc-500'}`}>
                        {log.role === 'user' ? '👤 ' : '🤖 '}{log.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Summarize paragraph..."
                      value={aiChatQuery}
                      onChange={(e) => setAiChatQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendAIChatMsg() }}
                      className="flex-1 h-7 bg-zinc-900 border border-zinc-800 rounded px-2 outline-none focus:border-cyan-500 text-xs text-white"
                    />
                    <button onClick={sendAIChatMsg} className="px-2.5 h-7 rounded bg-cyan-400 text-zinc-950 font-bold uppercase text-[10px] transition hover:bg-white">Send</button>
                  </div>
                </div>

              </div>
            )}

            {/* Execute trigger section */}
            <div className="border-t border-zinc-900 pt-4 space-y-3.5">
              <button
                onClick={handleExecuteAction}
                disabled={processing}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition hover:bg-white disabled:opacity-50"
              >
                {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                <span>Execute {activeTool.name}</span>
              </button>

              {processLog && (
                <div className="font-mono text-[9px] text-zinc-500 whitespace-pre-wrap leading-normal border border-zinc-900 p-2.5 rounded-lg bg-zinc-900/10">
                  {processLog}
                </div>
              )}
            </div>

            {/* Download Compiled Output Items */}
            {outputs.length > 0 && (
              <div className="border-t border-zinc-900 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Download Files</span>
                
                <div className="space-y-1.5">
                  {outputs.map((out) => (
                    <button
                      key={out.id}
                      onClick={() => {
                        const url = URL.createObjectURL(out.blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = out.name
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider transition hover:bg-cyan-500/25"
                    >
                      <span className="truncate max-w-[180px] font-mono lowercase">{out.name}</span>
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </aside>

      </div>

      {/* ========================================== */}
      {/* D. SIGNATURE PAD DRAWING MODAL OVERLAY     */}
      {/* ========================================== */}
      {sigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-[450px] border border-zinc-800 bg-zinc-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none">
            
            <div className="px-5 py-3 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">Sign Stamp Pad</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Draw signature locally</span>
            </div>

            <div className="p-6 bg-zinc-950 flex flex-col items-center justify-center gap-4">
              <canvas
                ref={sigCanvasRef}
                width={360}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="bg-black border border-zinc-850 rounded-xl cursor-crosshair"
              />
              <span className="text-[10px] text-zinc-600">Place mouse/stylus brush to draw inside the grid area.</span>
            </div>

            <div className="px-5 py-3.5 border-t border-zinc-900 bg-zinc-900/30 flex justify-end gap-2.5">
              <button
                onClick={() => setSigModalOpen(false)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={clearSignature}
                className="px-4 py-2 border border-red-900/30 bg-red-950/15 hover:bg-red-900/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider transition"
              >
                Clear
              </button>
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-cyan-400 text-zinc-950 hover:bg-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-cyan-400/10 transition"
              >
                Insert Signature
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Layout Sandbox coordinates visual editor */}
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
