'use client'

import { useRef, useEffect, useCallback, useState } from "react"
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Outdent, Indent, Undo, Redo, Image, Table, Link, Heading1, Heading2,
  Heading3, Eye, FileText, Settings, ShieldAlert, Sparkles, HelpCircle, FileDown, PlusCircle, CheckSquare, ListPlus, Trash2, Scissors
} from "lucide-react"

interface WordEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  files: File[]
  onInsertImage: (file: File) => void
  wordCount: number
  pageCount: number
  watermarkText: string
  setWatermarkText: (text: string) => void
  showPageNumbers: boolean
  setShowPageNumbers: (show: boolean) => void
  margins: string
  setMargins: (m: string) => void
  orientation: "Portrait" | "Landscape"
  setOrientation: (o: "Portrait" | "Landscape") => void
  pageSize: "A4" | "Letter" | "Legal"
  setPageSize: (s: "A4" | "Letter" | "Legal") => void
}

function Divider() {
  return <div className="w-px h-7 bg-zinc-800 mx-1.5 shrink-0 self-center" />
}

const FONTS = [
  "Geist Sans", "Arial", "Times New Roman", "Calibri", "Georgia", "Verdana", "Courier New", "Tahoma"
]

const SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"]

export default function WordEditor({
  editorRef,
  files,
  onInsertImage,
  wordCount,
  pageCount,
  watermarkText,
  setWatermarkText,
  showPageNumbers,
  setShowPageNumbers,
  margins,
  setMargins,
  orientation,
  setOrientation,
  pageSize,
  setPageSize
}: WordEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<"home" | "insert" | "layout" | "forms" | "help">("home")
  const [font, setFont] = useState("Calibri")
  const [fontSize, setFontSize] = useState("11")
  const [zoom, setZoom] = useState(100)
  
  // Custom interactive features
  const [redactMode, setRedactMode] = useState(false)
  const [activeShape, setActiveShape] = useState<string | null>(null)
  const [headerText, setHeaderText] = useState("Gauss Workspace Header")
  const [footerText, setFooterText] = useState("Confidential - Local-First Offline")

  const applyFont = useCallback((f: string) => {
    setFont(f)
    editorRef.current?.focus()
    document.execCommand("fontName", false, f)
  }, [editorRef])

  const applyFontSize = useCallback((s: string) => {
    setFontSize(s)
    editorRef.current?.focus()
    document.execCommand("styleWithCSS", false, "true")
    document.execCommand("fontSize", false, "7")
    const fontElements = editorRef.current?.querySelectorAll('font[size="7"]')
    fontElements?.forEach((el) => {
      ;(el as HTMLElement).removeAttribute("size")
      ;(el as HTMLElement).style.fontSize = `${s}pt`
    })
    document.execCommand("styleWithCSS", false, "false")
  }, [editorRef])

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }, [editorRef])

  const insertTable = useCallback((rows: number, cols: number) => {
    editorRef.current?.focus()
    let html = '<table style="border-collapse:collapse;width:100%;margin:12px 0;border:1px solid #3f3f46">'
    for (let r = 0; r < rows; r++) {
      html += "<tr>"
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #3f3f46;padding:8px 12px;min-width:50px;color:#f4f4f5">&nbsp;</td>'
      }
      html += "</tr>"
    }
    html += "</table><p><br></p>"
    document.execCommand("insertHTML", false, html)
  }, [editorRef])

  // Custom visual shape element insert
  const insertShape = (shapeType: "rect" | "circle" | "line") => {
    editorRef.current?.focus()
    let html = ""
    if (shapeType === "rect") {
      html = `<div contenteditable="false" style="display:inline-block;width:120px;height:60px;background-color:#22d3ee;border:2px solid #0891b2;margin:8px;border-radius:6px;" class="shape-node"></div>`
    } else if (shapeType === "circle") {
      html = `<div contenteditable="false" style="display:inline-block;width:80px;height:80px;background-color:#fbbf24;border:2px solid #d97706;border-radius:50%;margin:8px;" class="shape-node"></div>`
    } else {
      html = `<div contenteditable="false" style="display:block;width:100%;height:3px;background-color:#a1a1aa;margin:16px 0;" class="shape-node"></div>`
    }
    document.execCommand("insertHTML", false, html)
  }

  // Insert interactive form field elements
  const insertFormField = (type: "text" | "checkbox" | "select") => {
    editorRef.current?.focus()
    let html = ""
    const randId = Math.random().toString(36).substring(7)
    if (type === "text") {
      html = `<span contenteditable="false" class="formfield-wrapper" data-field-type="text" data-field-name="text_${randId}" style="display:inline-flex;align-items:center;background:#18181b;border:1px solid #3f3f46;border-radius:4px;padding:2px 8px;margin:2px 4px;"><input type="text" placeholder="Fillable Text Box" style="background:transparent;border:none;color:#e4e4e7;font-size:10pt;outline:none;width:120px;"/></span>&nbsp;`
    } else if (type === "checkbox") {
      html = `<span contenteditable="false" class="formfield-wrapper" data-field-type="checkbox" data-field-name="check_${randId}" style="display:inline-flex;align-items:center;background:#18181b;border:1px solid #3f3f46;border-radius:4px;padding:2px 6px;margin:2px 4px;"><input type="checkbox" style="accent-color:#22d3ee;margin-right:4px;"/><label style="font-size:9pt;color:#a1a1aa;">Check Box</label></span>&nbsp;`
    } else if (type === "select") {
      html = `<span contenteditable="false" class="formfield-wrapper" data-field-type="select" data-field-name="select_${randId}" data-field-options="Option 1,Option 2,Option 3" style="display:inline-flex;align-items:center;background:#18181b;border:1px solid #3f3f46;border-radius:4px;padding:2px 6px;margin:2px 4px;"><select style="background:transparent;border:none;color:#e4e4e7;font-size:9pt;outline:none;"><option style="background:#09090b;">Option 1</option><option style="background:#09090b;">Option 2</option><option style="background:#09090b;">Option 3</option></select></span>&nbsp;`
    }
    document.execCommand("insertHTML", false, html)
  }

  // Handle redaction click on document DOM elements
  const handleRedactClick = (e: React.MouseEvent) => {
    if (!redactMode) return
    const target = e.target as HTMLElement
    if (target === editorRef.current) return
    e.stopPropagation()
    e.preventDefault()

    // Redact target node content visually and logically
    target.style.backgroundColor = "#000000"
    target.style.color = "#000000"
    target.style.borderColor = "#000000"
    target.setAttribute("data-redacted", "true")
    target.classList.add("redacted-block")
    
    // Set text to empty or redacted
    if (target.children.length === 0) {
      target.innerText = "[REDACTED]"
    }
  }

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML.trim()) return
    editorRef.current.innerHTML = `
      <h1 style="font-family:'Geist Sans';font-size:24pt;font-weight:bold;color:#22d3ee;margin:0 0 16px;">Local Document Studio Workspace</h1>
      <p style="font-family:'Geist Sans';font-size:11pt;margin:0 0 12px;color:#e4e4e7;">Welcome to Gauss Document Studio. This workspace runs <strong>100% offline</strong> inside your browser sandbox.</p>
      <p style="font-family:'Geist Sans';font-size:11pt;margin:0 0 12px;color:#e4e4e7;">Write, formatting document layouts, insert interactive form elements, apply Bates stamps, or visual watermark signatures completely private.</p>
    `
  }, [editorRef])

  // Get margins size in CSS padding
  const getPaddingStyle = () => {
    if (margins === "narrow") return "24px 36px"
    if (margins === "wide") return "64px 80px"
    return "44px 56px"
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950/70 backdrop-blur-md">
      
      {/* 1. Header Toolbar Title */}
      <div className="bg-zinc-950 px-5 py-2.5 flex items-center justify-between border-b border-zinc-900 select-none">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Document Studio Workspace</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-mono">
          <span>{wordCount} Words</span>
          <span>·</span>
          <span>~{pageCount} Page{pageCount !== 1 ? "s" : ""}</span>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-cyan-300 font-bold uppercase tracking-widest">OFFLINE SECURE</span>
        </div>
      </div>

      {/* 2. Ribbon Tabs selection */}
      <div className="bg-zinc-900/50 border-b border-zinc-900 flex items-end gap-1 px-4 pt-1.5 select-none">
        {[
          { id: "home", label: "Home", icon: FileText },
          { id: "insert", label: "Insert", icon: PlusCircle },
          { id: "layout", label: "Layout", icon: Settings },
          { id: "forms", label: "Forms", icon: CheckSquare },
          { id: "help", label: "Help Guide", icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setActiveTab(tab.id as any) }}
              className={[
                "flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all rounded-t-lg border-t border-x",
                activeTab === tab.id
                  ? "bg-zinc-950 border-zinc-800 text-cyan-300 -mb-px"
                  : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white"
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Ribbon Panel Toolbar Content */}
      <div className="bg-zinc-950 border-b border-zinc-900 min-h-[52px] select-none flex items-center px-4 py-2 flex-wrap gap-y-2">
        {activeTab === "home" && (
          <div className="flex items-center gap-1 flex-wrap">
            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5">
              <button title="Undo" onClick={() => exec("undo")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Undo className="h-3.5 w-3.5" /></button>
              <button title="Redo" onClick={() => exec("redo")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Redo className="h-3.5 w-3.5" /></button>
            </div>
            <Divider />

            {/* Typography fonts */}
            <div className="flex items-center gap-1.5">
              <select
                title="Font Face"
                value={font}
                onChange={(e) => applyFont(e.target.value)}
                className="h-7 border border-zinc-800 bg-zinc-900 text-[11px] text-white rounded px-2 outline-none focus:border-cyan-500 cursor-pointer"
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                title="Font Size"
                value={fontSize}
                onChange={(e) => applyFontSize(e.target.value)}
                className="h-7 border border-zinc-800 bg-zinc-900 text-[11px] text-white rounded px-2 outline-none focus:border-cyan-500 cursor-pointer w-14"
              >
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Divider />

            {/* Formats style buttons */}
            <div className="flex items-center gap-0.5">
              <button title="Bold (Ctrl+B)" onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Bold className="h-3.5 w-3.5" /></button>
              <button title="Italic (Ctrl+I)" onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Italic className="h-3.5 w-3.5" /></button>
              <button title="Underline (Ctrl+U)" onClick={() => exec("underline")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Underline className="h-3.5 w-3.5" /></button>
              <button title="Strikethrough" onClick={() => exec("strikeThrough")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Strikethrough className="h-3.5 w-3.5" /></button>
            </div>
            <Divider />

            {/* Alignments */}
            <div className="flex items-center gap-0.5">
              <button title="Align Left" onClick={() => exec("justifyLeft")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><AlignLeft className="h-3.5 w-3.5" /></button>
              <button title="Align Center" onClick={() => exec("justifyCenter")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><AlignCenter className="h-3.5 w-3.5" /></button>
              <button title="Align Right" onClick={() => exec("justifyRight")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><AlignRight className="h-3.5 w-3.5" /></button>
              <button title="Justify" onClick={() => exec("justifyFull")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><AlignJustify className="h-3.5 w-3.5" /></button>
            </div>
            <Divider />

            {/* Lists */}
            <div className="flex items-center gap-0.5">
              <button title="Bullet List" onClick={() => exec("insertUnorderedList")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><List className="h-3.5 w-3.5" /></button>
              <button title="Ordered List" onClick={() => exec("insertOrderedList")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><ListOrdered className="h-3.5 w-3.5" /></button>
            </div>
            <Divider />

            {/* Style blocks */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button onClick={() => exec("formatBlock", "h1")} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition">H1</button>
              <button onClick={() => exec("formatBlock", "h2")} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition">H2</button>
              <button onClick={() => exec("formatBlock", "p")} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition">Body</button>
              <button onClick={() => exec("removeFormat")} className="px-2 py-1 rounded bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-900/30 transition">Clear Style</button>
            </div>
          </div>
        )}

        {activeTab === "insert" && (
          <div className="flex items-center gap-1 flex-wrap">
            {/* Attachment input image */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                onInsertImage(file)
                e.target.value = ""
              }}
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <Image className="h-4 w-4 text-cyan-400" />
              <span>Picture</span>
            </button>
            
            <Divider />

            {/* Insert Shape buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Insert Shapes:</span>
              <button onClick={() => insertShape("rect")} className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs transition">Square</button>
              <button onClick={() => insertShape("circle")} className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs transition">Circle</button>
              <button onClick={() => insertShape("line")} className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs transition">Divider</button>
            </div>

            <Divider />

            {/* Table, Link, PageBreak */}
            <button
              onClick={() => insertTable(3, 4)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <Table className="h-4 w-4 text-amber-400" />
              <span>Table (3x4)</span>
            </button>

            <button
              onClick={() => {
                const url = window.prompt("Enter Link URL:", "https://")
                if (url) exec("createLink", url)
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <Link className="h-4 w-4 text-cyan-400" />
              <span>Hyperlink</span>
            </button>

            <button
              onClick={() => exec("insertHorizontalRule")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <span className="font-bold text-amber-400">---</span>
              <span>Page Break</span>
            </button>
          </div>
        )}

        {activeTab === "layout" && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Margins */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Margins:</span>
              {(["normal", "narrow", "wide"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMargins(m)}
                  className={[
                    "px-2.5 py-1 text-xs rounded capitalize font-semibold transition",
                    margins === m ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  ].join(" ")}
                >
                  {m}
                </button>
              ))}
            </div>
            
            <Divider />

            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Page Size:</span>
              {(["A4", "Letter", "Legal"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPageSize(sz)}
                  className={[
                    "px-2.5 py-1 text-xs rounded font-semibold transition",
                    pageSize === sz ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  ].join(" ")}
                >
                  {sz}
                </button>
              ))}
            </div>

            <Divider />

            {/* Orientation */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Orientation:</span>
              {(["Portrait", "Landscape"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className={[
                    "px-2.5 py-1 text-xs rounded font-semibold transition",
                    orientation === o ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  ].join(" ")}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "forms" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Insert Fields:</span>
            
            <button
              onClick={() => insertFormField("text")}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition"
            >
              <span className="h-2 w-4 border border-cyan-400 block" />
              <span>Fillable Text Box</span>
            </button>

            <button
              onClick={() => insertFormField("checkbox")}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition"
            >
              <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
              <span>Check Box field</span>
            </button>

            <button
              onClick={() => insertFormField("select")}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition"
            >
              <ListPlus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Selector Dropdown</span>
            </button>
            
            <Divider />
            
            <span className="text-[9px] text-zinc-500 max-w-[200px] leading-tight">These will compile into fillable fields in the exported PDF forms document.</span>
          </div>
        )}

        {activeTab === "help" && (
          <div className="text-zinc-400 text-xs flex items-center justify-between w-full">
            <span>💡 <strong>Docs Studio Guide</strong>: Write text, format styling, or drag-and-drop images. Press 'Export PDF' in the Right Panel to build your documents.</span>
            <span className="font-mono text-[9px] text-cyan-400">Gauss Engine v2.1</span>
          </div>
        )}
      </div>

      {/* 4. Settings Toolbar (Header/Footer, Redaction Brush, Watermark inputs) */}
      <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Visual Redaction Brush Toggle */}
        <div className="flex items-center gap-4">
          <label className={classNames(
            "flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer transition select-none font-bold uppercase text-[10px]",
            redactMode 
              ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse" 
              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
          )}>
            <input
              type="checkbox"
              checked={redactMode}
              onChange={(e) => setRedactMode(e.target.checked)}
              className="hidden"
            />
            <Scissors className="h-3.5 w-3.5" />
            <span>Redaction Brush</span>
          </label>
          
          {redactMode && (
            <span className="text-[10px] text-red-400/80">Click elements on the paper to permanently black them out.</span>
          )}
        </div>

        {/* Layout margins & custom Watermark configuration */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2">
            <span className="text-zinc-500 uppercase font-black text-[9px]">Document Watermark:</span>
            <input
              type="text"
              placeholder="e.g. DRAFT"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-[11px] text-white rounded px-2 py-1 outline-none focus:border-cyan-500 w-24 placeholder:text-zinc-600 font-mono"
            />
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showPageNumbers}
              onChange={(e) => setShowPageNumbers(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-950 text-cyan-400 accent-cyan-300"
            />
            <span className="text-zinc-400 text-[11px]">Show page numbers</span>
          </label>
        </div>
      </div>

      {/* 5. Ruler */}
      <div className="bg-zinc-950 border-b border-zinc-900 h-6 flex items-end px-6 overflow-hidden select-none">
        <div className="flex items-end" style={{ marginLeft: "52px" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="flex flex-col items-start" style={{ width: "20px" }}>
              {i % 5 === 0 && (
                <span className="text-[7px] font-mono text-zinc-650 leading-none mb-0.5">{i / 5}</span>
              )}
              <div
                className="bg-zinc-800"
                style={{ height: i % 5 === 0 ? "8px" : i % 5 === 2 ? "5px" : "3px", width: "1px" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Document Paper Canvas */}
      <div className="flex-1 overflow-auto bg-zinc-900/40 py-10 px-4 flex flex-col items-center gap-6 min-h-[580px] relative">
        
        {/* Paper Sheet container */}
        <div
          className={classNames(
            "bg-zinc-950 border relative transition-all duration-200 select-text overflow-hidden shadow-2xl rounded-lg cursor-text",
            redactMode ? "border-red-500/20 shadow-red-950/5" : "border-zinc-800"
          )}
          style={{
            width: orientation === "Portrait" ? `${595 * (zoom / 100)}px` : `${842 * (zoom / 100)}px`,
            minHeight: orientation === "Portrait" ? `${842 * (zoom / 100)}px` : `${595 * (zoom / 100)}px`,
            padding: getPaddingStyle(),
          }}
          onClick={handleRedactClick}
        >
          {/* Header text representation */}
          <div className="absolute top-4 left-6 right-6 border-b border-zinc-900/50 pb-1 text-[9px] text-zinc-500 font-mono flex justify-between select-none">
            <span>{headerText.toUpperCase()}</span>
            <span>GAUSS LOCAL WORKSPACE</span>
          </div>

          {/* Interactive angled Watermark preview display */}
          {watermarkText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03] z-0">
              <span className="font-black text-cyan-300 select-none transform -rotate-30 tracking-widest text-center uppercase" style={{ fontSize: "6.5vw" }}>
                {watermarkText}
              </span>
            </div>
          )}

          {/* Core contentEditable text canvas */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none w-full h-full text-zinc-200 relative z-10 selection:bg-cyan-500/20"
            style={{
              fontFamily: "var(--font-geist-sans), Arial, sans-serif",
              fontSize: "11pt",
              lineHeight: "1.6",
              minHeight: "560px",
              zoom: `${zoom}%`
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text/plain")
              if (text) {
                e.preventDefault()
                document.execCommand("insertText", false, text)
              }
            }}
          />

          {/* Footer & Page Numbers representation */}
          <div className="absolute bottom-4 left-6 right-6 border-t border-zinc-900/50 pt-1.5 text-[9px] text-zinc-500 font-mono flex justify-between select-none">
            <span>{footerText}</span>
            {showPageNumbers && <span>Page 1 of ~{pageCount}</span>}
          </div>
        </div>
      </div>

      {/* 7. Status Bar controls */}
      <div className="bg-zinc-950 px-5 py-1.5 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400 select-none font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Local Sync Status: OK (Autosaved)</span>
          </span>
          <span>{wordCount} Words</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="hover:bg-zinc-900 rounded h-5 w-5 flex items-center justify-center hover:text-white font-bold"
            >−</button>
            <span className="w-10 text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="hover:bg-zinc-900 rounded h-5 w-5 flex items-center justify-center hover:text-white font-bold"
            >+</button>
          </div>
        </div>
      </div>
      
    </div>
  )
}

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
