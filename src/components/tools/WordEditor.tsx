'use client'

import { useRef, useEffect, useCallback, useState } from "react"
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Outdent, Indent, Undo, Redo, Image as ImageIcon, Table, Link,
  FileText, Settings, HelpCircle, FileDown, PlusCircle, Scissors,
  Type, Palette, ClipboardList, Info, Calendar, Milestone
} from "lucide-react"
import { exportToDocx } from "@/lib/tools/docxExporter"
import { importFromDocx } from "@/lib/tools/docxParser"
import { htmlToMarkdown, markdownToHtml } from "@/lib/tools/markdownConverter"

interface WordEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>
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

interface ExtendedWindow extends Window {
  find(
    aString: string,
    aCaseSensitive?: boolean,
    aBackwards?: boolean,
    aWrapAround?: boolean,
    aWholeWord?: boolean,
    aSearchInFrames?: boolean,
    aShowDialog?: boolean
  ): boolean
}

function Divider() {
  return <div className="w-px h-7 bg-zinc-800 mx-1.5 shrink-0 self-center" />
}

const FONTS = [
  "Geist Sans", "Arial", "Times New Roman", "Calibri", "Georgia", "Verdana", "Courier New", "Tahoma"
]

const SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"]

// Color grids
function ColorGrid({ onSelectColor, label }: { onSelectColor: (color: string) => void; label: string }) {
  const colors = [
    { name: "Default/Clear", hex: "inherit" },
    { name: "Cyan", hex: "#22d3ee" },
    { name: "Amber", hex: "#fbbf24" },
    { name: "Red", hex: "#f87171" },
    { name: "Green", hex: "#4ade80" },
    { name: "Blue", hex: "#60a5fa" },
    { name: "Purple", hex: "#c084fc" },
    { name: "Grey", hex: "#a1a1aa" },
    { name: "Black", hex: "#050605" },
    { name: "White", hex: "#ffffff" }
  ]
  return (
    <div className="absolute z-50 mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl grid grid-cols-5 gap-1 select-none">
      <div className="col-span-5 text-[9px] text-zinc-500 font-bold uppercase pb-1 border-b border-zinc-900 mb-1">{label}</div>
      {colors.map((c) => (
        <button
          key={c.name}
          title={c.name}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelectColor(c.hex)
          }}
          className="w-5 h-5 rounded border border-zinc-850 hover:border-zinc-500 transition"
          style={{ backgroundColor: c.hex === "inherit" ? "transparent" : c.hex }}
        />
      ))}
    </div>
  )
}

// Table Grid selector
function TableGridSelector({ onSelectGrid }: { onSelectGrid: (rows: number, cols: number) => void }) {
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null)
  return (
    <div className="absolute z-50 mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl select-none">
      <div className="text-[10px] text-zinc-400 font-bold mb-2">
        {hoveredCell ? `Table: ${hoveredCell.r} x ${hoveredCell.c}` : "Select grid size"}
      </div>
      <div className="grid grid-cols-10 gap-0.5 border border-zinc-900 p-1 bg-zinc-900/20 rounded">
        {Array.from({ length: 10 }, (_, rIdx) => {
          const r = rIdx + 1
          return Array.from({ length: 10 }, (_, cIdx) => {
            const c = cIdx + 1
            const isHighlighted = hoveredCell && r <= hoveredCell.r && c <= hoveredCell.c
            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => setHoveredCell({ r, c })}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelectGrid(r, c)
                }}
                className={`w-4 h-4 border border-zinc-900 transition-all cursor-pointer ${
                  isHighlighted ? "bg-cyan-400/80 border-cyan-400" : "bg-zinc-950 hover:bg-zinc-800"
                }`}
              />
            )
          })
        })}
      </div>
    </div>
  )
}

// Symbols Picker
function SymbolPicker({ onSelectSymbol }: { onSelectSymbol: (sym: string) => void }) {
  const symbols = ["©", "®", "™", "€", "£", "¥", "§", "°", "±", "×", "÷", "¹", "²", "³", "½", "¼", "¾", "«", "»", "¶"]
  return (
    <div className="absolute z-50 mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl grid grid-cols-5 gap-1.5 select-none w-44">
      {symbols.map(s => (
        <button
          key={s}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelectSymbol(s)
          }}
          className="h-8 w-8 rounded bg-zinc-900 hover:bg-zinc-850 hover:text-cyan-300 flex items-center justify-center text-sm text-zinc-300 font-bold transition border border-zinc-850"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

export default function WordEditor({
  editorRef,
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
  const importFileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<"file" | "home" | "insert" | "layout" | "review" | "help">("home")
  const [font, setFont] = useState("Calibri")
  const [fontSize, setFontSize] = useState("11")
  const [zoom, setZoom] = useState(100)
  
  // Color controls states
  const [showTextColor, setShowTextColor] = useState(false)
  const [showBgColor, setShowBgColor] = useState(false)
  
  // Table insert hover states
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)

  // Columns & custom margins
  const [columns, setColumns] = useState<1 | 2 | 3>(1)
  const [isCustomMargin, setIsCustomMargin] = useState(false)
  const [customMargins, setCustomMargins] = useState({ top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 })

  // Find & Replace
  const [findText, setFindText] = useState("")
  const [replaceText, setReplaceText] = useState("")
  const [matchCase, setMatchCase] = useState(false)
  const [matchWholeWord, setMatchWholeWord] = useState(false)
  const [replaceMessage, setReplaceMessage] = useState("")

  // Review states
  const [docOutline, setDocOutline] = useState<{ id: string; text: string; level: number }[]>([])
  const [statsSummary, setStatsSummary] = useState({ chars: 0, sentences: 0, paragraphs: 0, readingTime: 0, fleschScore: 0 })

  // Custom interactive features
  const [redactMode, setRedactMode] = useState(false)
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

  const applyTextColor = (color: string) => {
    setShowTextColor(false)
    exec("foreColor", color)
  }

  const applyHighlightColor = (color: string) => {
    setShowBgColor(false)
    exec("styleWithCSS", "true")
    exec("hiliteColor", color)
    exec("styleWithCSS", "false")
  }

  const clearFormatting = () => {
    exec("removeFormat")
    // Manually strip inline styles from selected block if needed
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const container = range.commonAncestorContainer
      const parent = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement
      if (parent && parent !== editorRef.current) {
        parent.removeAttribute("style")
      }
    }
  }

  const insertTable = useCallback((rows: number, cols: number) => {
    setShowTablePicker(false)
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

  const insertSymbol = (sym: string) => {
    setShowSymbolPicker(false)
    editorRef.current?.focus()
    document.execCommand("insertText", false, sym)
  }

  const insertDateTime = () => {
    const stamp = new Date().toLocaleString()
    exec("insertText", stamp)
  }

  const insertTableOfContents = () => {
    editorRef.current?.focus()
    const headings = getHeadingsList()
    if (headings.length === 0) {
      alert("No headings (H1/H2/H3) found to build Table of Contents.")
      return
    }

    let tocHtml = `<div class="toc-block" contenteditable="false" style="border:1px solid #3f3f46;background:#0d0e0d;padding:16px;margin:16px 0;border-radius:10px;color:#e4e4e7;max-width:600px;">
      <h4 style="margin:0 0 12px;color:#22d3ee;font-weight:bold;font-size:12pt;border-bottom:1px solid #202220;padding-bottom:6px;">Table of Contents</h4>`
    
    headings.forEach(h => {
      const margin = h.level === 1 ? "0px" : h.level === 2 ? "12px" : "24px"
      const color = h.level === 1 ? "#22d3ee" : "#a1a1aa"
      const fontSize = h.level === 1 ? "10pt" : "9pt"
      
      tocHtml += `<div style="margin-left:${margin};margin-bottom:6px;font-size:${fontSize};">
        <a href="#${h.id}" style="color:${color};text-decoration:none;display:flex;justify-content:space-between;align-items:end;">
          <span>${h.text}</span>
          <span style="border-bottom:1px dotted #3f3f46;flex:1;margin:0 8px;margin-bottom:4px;"></span>
          <span style="font-size:8pt;color:#71717a;">Page 1</span>
        </a>
      </div>`
    })
    tocHtml += `</div><p><br></p>`
    document.execCommand("insertHTML", false, tocHtml)
  }

  // Double click redaction toggles
  const handleRedactClick = (e: React.MouseEvent) => {
    if (!redactMode) return
    const target = e.target as HTMLElement
    if (target === editorRef.current) return
    e.stopPropagation()
    e.preventDefault()

    target.style.backgroundColor = "#000000"
    target.style.color = "#000000"
    target.style.borderColor = "#000000"
    target.setAttribute("data-redacted", "true")
    target.classList.add("redacted-block")
    
    if (target.children.length === 0) {
      target.innerText = "[REDACTED]"
    }
  }

  // Find & Replace
  const handleFind = () => {
    if (!findText) return
    const found = (window as unknown as ExtendedWindow).find(findText, matchCase, false, true, matchWholeWord, false, false)
    if (!found) {
      setReplaceMessage("Phrase not found.")
    } else {
      setReplaceMessage("Found occurrence.")
    }
  }

  const handleReplace = () => {
    if (!findText) return
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (range.toString().toLowerCase() === findText.toLowerCase()) {
        range.deleteContents()
        range.insertNode(document.createTextNode(replaceText))
        setReplaceMessage("Replaced occurrence.")
        handleFind() // Find next automatically
        return
      }
    }
    // If not currently selected, find first
    handleFind()
  }

  const handleReplaceAll = () => {
    if (!findText) return
    let count = 0
    window.getSelection()?.removeAllRanges()
    let found = true
    while (found) {
      found = (window as unknown as ExtendedWindow).find(findText, matchCase, false, true, matchWholeWord, false, false)
      if (found) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(replaceText))
          count++
        }
      }
    }
    setReplaceMessage(`Replaced ${count} occurrences total.`)
  }

  // Helpers to scan headings
  const getHeadingsList = (): { id: string; text: string; level: number }[] => {
    if (!editorRef.current) return []
    const headings: { id: string; text: string; level: number }[] = []
    const elNodes = editorRef.current.querySelectorAll("h1, h2, h3")
    elNodes.forEach((node, i) => {
      const el = node as HTMLElement
      let id = el.getAttribute("id")
      if (!id) {
        id = `heading-ref-${i}`
        el.setAttribute("id", id)
      }
      headings.push({
        id,
        text: el.innerText || el.textContent || `Section ${i+1}`,
        level: el.tagName.toLowerCase() === "h1" ? 1 : el.tagName.toLowerCase() === "h2" ? 2 : 3
      })
    })
    return headings
  }

  // Compute stats on review tab focus
  const compileStatistics = () => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ""
    const chars = text.length
    
    // Words
    const wordsArr = text.trim() ? text.trim().split(/\s+/) : []
    const words = wordsArr.length

    // Sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length || 1

    // Paragraphs
    const paragraphs = editorRef.current.querySelectorAll("p, h1, h2, h3, li").length || 1

    // Syllables and Flesch reading ease estimation
    let syllables = 0
    wordsArr.forEach(w => {
      syllables += countWordSyllables(w)
    })

    const avgSentenceLength = words / sentences
    const avgSyllablesPerWord = syllables / (words || 1)
    
    // Flesch Reading Ease Index Formula
    let fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    fleschScore = Math.max(0, Math.min(100, Math.round(fleschScore)))

    setStatsSummary({
      chars,
      sentences,
      paragraphs,
      readingTime: Math.max(1, Math.ceil(words / 200)),
      fleschScore
    })
    setDocOutline(getHeadingsList())
  }

  function countWordSyllables(word: string): number {
    word = word.toLowerCase().trim()
    if (word.length <= 3) return 1
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    word = word.replace(/^y/, "")
    const vowels = word.match(/[aeiouy]{1,2}/g)
    return vowels ? vowels.length : 1
  }

  // Local Imports
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    
    try {
      let htmlContent = ""
      if (ext === ".docx") {
        htmlContent = await importFromDocx(file)
      } else if (ext === ".md") {
        const text = await file.text()
        htmlContent = markdownToHtml(text)
      } else if (ext === ".html" || ext === ".htm") {
        htmlContent = await file.text()
      } else {
        // Plain text
        const text = await file.text()
        htmlContent = text.split("\n").map(l => `<p>${l}</p>`).join("")
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent
        alert(`Successfully imported: ${file.name}`)
      }
    } catch (err) {
      alert(`Error reading file: ${(err as Error)?.message || String(err)}`)
    }
    
    e.target.value = ""
  }

  // Local Exports
  const handleExport = async (format: "docx" | "pdf" | "html" | "md" | "txt") => {
    if (!editorRef.current) return
    const contentHtml = editorRef.current.innerHTML
    const contentText = editorRef.current.innerText
    const docTitle = "Gauss_Document"

    if (format === "docx") {
      const blob = await exportToDocx(contentHtml, {
        pageSize,
        orientation,
        margins: isCustomMargin ? customMargins : (margins as "normal" | "narrow" | "wide"),
        watermarkText,
        headerText,
        footerText
      })
      downloadBlob(blob, `${docTitle}.docx`)
    } else if (format === "pdf") {
      // Native print will trigger standard browser print-to-pdf layout
      window.print()
    } else if (format === "html") {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #222; }
    h1 { color: #0891b2; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
    h2 { color: #0891b2; }
    h3 { color: #d97706; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    td, th { border: 1px solid #ddd; padding: 8px 12px; }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`
      downloadBlob(new Blob([fullHtml], { type: "text/html" }), `${docTitle}.html`)
    } else if (format === "md") {
      const md = htmlToMarkdown(contentHtml)
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${docTitle}.md`)
    } else {
      downloadBlob(new Blob([contentText], { type: "text/plain" }), `${docTitle}.txt`)
    }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
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

  const getPaddingStyle = () => {
    if (isCustomMargin) {
      return `${customMargins.top}in ${customMargins.right}in ${customMargins.bottom}in ${customMargins.left}in`
    }
    if (margins === "narrow") return "24px 36px"
    if (margins === "wide") return "64px 80px"
    return "44px 56px"
  }

  // Generate dynamic print CSS rule injection
  const computedPrintStyle = `
    @media print {
      body * {
        visibility: hidden !important;
      }
      #editor-paper-container, #editor-paper-container * {
        visibility: visible !important;
      }
      #editor-paper-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        border: none !important;
        background: white !important;
        color: black !important;
        padding: ${getPaddingStyle()} !important;
        box-shadow: none !important;
      }
      input {
        border: none !important;
        color: #555555 !important;
      }
      .toc-block {
        border: 1px solid #ccc !important;
        background: #f9f9f9 !important;
        color: black !important;
      }
    }
  `

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950/70 backdrop-blur-md">
      
      {/* Dynamic print-to-PDF stylesheet rule */}
      <style dangerouslySetInnerHTML={{ __html: computedPrintStyle }} />

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
          { id: "file", label: "File", icon: FileDown },
          { id: "home", label: "Home", icon: FileText },
          { id: "insert", label: "Insert", icon: PlusCircle },
          { id: "layout", label: "Layout", icon: Settings },
          { id: "review", label: "Review & Stats", icon: ClipboardList },
          { id: "help", label: "Help Guide", icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onMouseDown={(e) => { 
                e.preventDefault()
                setActiveTab(tab.id as "file" | "home" | "insert" | "layout" | "review" | "help") 
                if (tab.id === "review") compileStatistics()
              }}
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
      <div className="bg-zinc-950 border-b border-zinc-900 min-h-[52px] select-none flex items-center px-4 py-2 flex-wrap gap-y-2 relative">
        
        {/* TAB: FILE - local imports & formats exports */}
        {activeTab === "file" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Import Trigger */}
            <input
              ref={importFileInputRef}
              type="file"
              accept=".docx,.md,.html,.txt"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => importFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 font-bold hover:bg-zinc-800 hover:text-white transition"
            >
              📁 Open / Import Document
            </button>

            <Divider />
            
            <span className="text-[10px] text-zinc-500 uppercase font-black mr-1">Download formats:</span>
            <button
              onClick={() => handleExport("docx")}
              className="px-2.5 py-1.5 rounded bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 text-[11px] font-bold hover:bg-cyan-900/30 transition"
            >
              DOCX
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-2.5 py-1.5 rounded bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 text-[11px] font-bold hover:bg-cyan-900/30 transition"
            >
              PDF Print
            </button>
            <button
              onClick={() => handleExport("html")}
              className="px-2.5 py-1.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[11px] font-bold hover:text-white transition"
            >
              HTML
            </button>
            <button
              onClick={() => handleExport("md")}
              className="px-2.5 py-1.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[11px] font-bold hover:text-white transition"
            >
              Markdown
            </button>
            <button
              onClick={() => handleExport("txt")}
              className="px-2.5 py-1.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[11px] font-bold hover:text-white transition"
            >
              Text (.txt)
            </button>
          </div>
        )}

        {/* TAB: HOME - Advanced formatting and styling */}
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

            {/* Superscript/Subscript */}
            <div className="flex items-center gap-0.5">
              <button title="Superscript" onClick={() => exec("superscript")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-400 font-mono text-[10px] font-bold">X²</button>
              <button title="Subscript" onClick={() => exec("subscript")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-400 font-mono text-[10px] font-bold">X₂</button>
            </div>
            <Divider />

            {/* Color Grids triggers */}
            <div className="flex items-center gap-1.5 relative">
              <div className="relative">
                <button
                  title="Font Color"
                  onClick={() => { setShowTextColor(!showTextColor); setShowBgColor(false) }}
                  className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 flex items-center gap-1 transition"
                >
                  <Type className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[10px] font-bold">Color</span>
                </button>
                {showTextColor && (
                  <ColorGrid label="Font Color" onSelectColor={applyTextColor} />
                )}
              </div>

              <div className="relative">
                <button
                  title="Highlight Color"
                  onClick={() => { setShowBgColor(!showBgColor); setShowTextColor(false) }}
                  className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 flex items-center gap-1 transition"
                >
                  <Palette className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold">Highlight</span>
                </button>
                {showBgColor && (
                  <ColorGrid label="Text Shading" onSelectColor={applyHighlightColor} />
                )}
              </div>
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
              <button title="Indent" onClick={() => exec("indent")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Indent className="h-3.5 w-3.5" /></button>
              <button title="Outdent" onClick={() => exec("outdent")} className="p-1.5 rounded hover:bg-zinc-900 text-zinc-300 transition"><Outdent className="h-3.5 w-3.5" /></button>
            </div>
            <Divider />

            {/* Style blocks */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button onClick={() => exec("formatBlock", "h1")} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition">H1</button>
              <button onClick={() => exec("formatBlock", "h2")} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition">H2</button>
              <button onClick={() => exec("formatBlock", "p")} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition">Body</button>
              <button onClick={clearFormatting} className="px-2 py-1 rounded bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-900/30 transition">Clear Style</button>
            </div>
          </div>
        )}

        {/* TAB: INSERT - elements symbols, headers, watermark stamps */}
        {activeTab === "insert" && (
          <div className="flex items-center gap-1.5 flex-wrap">
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
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <ImageIcon className="h-4 w-4 text-cyan-400" />
              <span>Picture</span>
            </button>
            
            <Divider />

            {/* Grid Table selector */}
            <div className="relative">
              <button
                onClick={() => setShowTablePicker(!showTablePicker)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
              >
                <Table className="h-4 w-4 text-amber-400" />
                <span>Table</span>
              </button>
              {showTablePicker && (
                <TableGridSelector onSelectGrid={insertTable} />
              )}
            </div>

            <Divider />

            {/* Special Symbols */}
            <div className="relative">
              <button
                onClick={() => setShowSymbolPicker(!showSymbolPicker)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
              >
                <span className="font-bold text-cyan-400 text-xs">§</span>
                <span>Symbol</span>
              </button>
              {showSymbolPicker && (
                <SymbolPicker onSelectSymbol={insertSymbol} />
              )}
            </div>

            {/* Hyperlink */}
            <button
              onClick={() => {
                const url = window.prompt("Enter Link URL:", "https://")
                if (url) exec("createLink", url)
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <Link className="h-4 w-4 text-cyan-400" />
              <span>Hyperlink</span>
            </button>

            <Divider />

            {/* Date Time stamp */}
            <button
              onClick={insertDateTime}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
              title="Insert current date & time"
            >
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Timestamp</span>
            </button>

            {/* Table of Contents block */}
            <button
              onClick={insertTableOfContents}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
              title="Generate document index Table of Contents"
            >
              <Milestone className="h-4 w-4 text-cyan-400" />
              <span>Table of Contents</span>
            </button>

            {/* Page Break */}
            <button
              onClick={() => exec("insertHorizontalRule")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white rounded transition"
            >
              <span className="font-bold text-amber-400">---</span>
              <span>Page Break</span>
            </button>
          </div>
        )}

        {/* TAB: LAYOUT - page sizing orientation columns and custom margins */}
        {activeTab === "layout" && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Margins selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Margins:</span>
              {(["normal", "narrow", "wide"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMargins(m); setIsCustomMargin(false) }}
                  className={[
                    "px-2.5 py-1 text-xs rounded capitalize font-semibold transition",
                    (margins === m && !isCustomMargin) ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  ].join(" ")}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={() => setIsCustomMargin(true)}
                className={[
                  "px-2.5 py-1 text-xs rounded font-semibold transition",
                  isCustomMargin ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
                ].join(" ")}
              >
                Custom
              </button>
            </div>
            
            {/* Sliders for custom margins */}
            {isCustomMargin && (
              <div className="flex items-center gap-3.5 bg-zinc-900/40 border border-zinc-900 px-3 py-1 rounded-lg text-[9px] font-mono text-zinc-400">
                <label className="flex items-center gap-1">
                  <span>Top:</span>
                  <input
                    type="range" min="0.2" max="2.5" step="0.1"
                    value={customMargins.top}
                    onChange={(e) => setCustomMargins(prev => ({ ...prev, top: parseFloat(e.target.value) }))}
                    className="w-12 accent-cyan-400 h-1 bg-zinc-800 rounded"
                  />
                  <span className="font-bold w-4 text-center">{customMargins.top}in</span>
                </label>
                <label className="flex items-center gap-1">
                  <span>Bottom:</span>
                  <input
                    type="range" min="0.2" max="2.5" step="0.1"
                    value={customMargins.bottom}
                    onChange={(e) => setCustomMargins(prev => ({ ...prev, bottom: parseFloat(e.target.value) }))}
                    className="w-12 accent-cyan-400 h-1 bg-zinc-800 rounded"
                  />
                  <span className="font-bold w-4 text-center">{customMargins.bottom}in</span>
                </label>
                <label className="flex items-center gap-1">
                  <span>Left:</span>
                  <input
                    type="range" min="0.2" max="2.5" step="0.1"
                    value={customMargins.left}
                    onChange={(e) => setCustomMargins(prev => ({ ...prev, left: parseFloat(e.target.value) }))}
                    className="w-12 accent-cyan-400 h-1 bg-zinc-800 rounded"
                  />
                  <span className="font-bold w-4 text-center">{customMargins.left}in</span>
                </label>
                <label className="flex items-center gap-1">
                  <span>Right:</span>
                  <input
                    type="range" min="0.2" max="2.5" step="0.1"
                    value={customMargins.right}
                    onChange={(e) => setCustomMargins(prev => ({ ...prev, right: parseFloat(e.target.value) }))}
                    className="w-12 accent-cyan-400 h-1 bg-zinc-800 rounded"
                  />
                  <span className="font-bold w-4 text-center">{customMargins.right}in</span>
                </label>
              </div>
            )}

            <Divider />

            {/* Columns layout count */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Columns:</span>
              {([1, 2, 3] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setColumns(col)}
                  className={[
                    "px-2.5 py-1 text-xs rounded font-semibold transition",
                    columns === col ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  ].join(" ")}
                >
                  {col === 1 ? "1 Column" : `${col} Columns`}
                </button>
              ))}
            </div>

            <Divider />

            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Size:</span>
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

        {/* TAB: REVIEW & STATISTICS - Find & Replace, outlines readability */}
        {activeTab === "review" && (
          <div className="flex items-center gap-2 flex-wrap text-xs w-full justify-between">
            {/* Find and Replace Fields */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] text-zinc-500 uppercase font-bold mr-1">Find & Replace:</span>
              <input
                type="text"
                placeholder="Find phrase..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-[11px] text-white rounded px-2 py-1 outline-none focus:border-cyan-500 w-28"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-[11px] text-white rounded px-2 py-1 outline-none focus:border-cyan-500 w-28"
              />
              <button
                onClick={handleFind}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold"
              >
                Find Next
              </button>
              <button
                onClick={handleReplace}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold"
              >
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold"
              >
                Replace All
              </button>
              
              {/* Query checks */}
              <label className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="rounded border-zinc-750 bg-zinc-950 text-cyan-400 accent-cyan-300"
                />
                <span>Aa</span>
              </label>

              <label className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchWholeWord}
                  onChange={(e) => setMatchWholeWord(e.target.checked)}
                  className="rounded border-zinc-750 bg-zinc-950 text-cyan-400 accent-cyan-300"
                />
                <span>&quot;W&quot;</span>
              </label>
              
              {replaceMessage && (
                <span className="text-[10px] font-mono text-amber-400 italic px-2">{replaceMessage}</span>
              )}
            </div>

            {/* Refresh Statistics trigger button */}
            <button
              onClick={compileStatistics}
              className="px-2.5 py-1 text-[10px] bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 hover:bg-cyan-900/30 rounded font-bold transition flex items-center gap-1"
            >
              <Info className="h-3 w-3" />
              <span>Update stats</span>
            </button>
          </div>
        )}

        {/* TAB: HELP GUIDE */}
        {activeTab === "help" && (
          <div className="text-zinc-400 text-xs flex items-center justify-between w-full">
            <span>💡 <strong>Docs Studio Guide</strong>: Write text, format styling, or drag-and-drop images. Press &apos;Export PDF&apos; in the Right Panel to build your documents.</span>
            <span className="font-mono text-[9px] text-cyan-400">Gauss Engine v2.5</span>
          </div>
        )}
      </div>

      {/* 4. Settings Toolbar (Header/Footer, Redaction Brush, Watermark inputs) */}
      <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        
        {/* Visual Redaction Brush Toggle */}
        <div className="flex items-center gap-4">
          <label className={[
            "flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer transition select-none font-bold uppercase text-[10px]",
            redactMode 
              ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse" 
              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
          ].join(" ")}>
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
              className="rounded border-zinc-750 bg-zinc-950 text-cyan-400 accent-cyan-300"
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
                <span className="text-[7px] font-mono text-zinc-600 leading-none mb-0.5">{i / 5}</span>
              )}
              <div
                className="bg-zinc-850"
                style={{ height: i % 5 === 0 ? "8px" : i % 5 === 2 ? "5px" : "3px", width: "1px" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Main Document Panel Chassis (combining editor paper & side review info) */}
      <div className="flex-1 flex bg-zinc-900/40 relative overflow-hidden">
        
        {/* Left Document Paper Canvas */}
        <div className="flex-1 overflow-auto py-10 px-4 flex flex-col items-center gap-6 min-h-[600px] relative">
          
          {/* Paper Sheet container */}
          <div
            id="editor-paper-container"
            className={[
              "bg-zinc-950 border relative transition-all duration-200 select-text overflow-hidden shadow-2xl rounded-lg cursor-text",
              redactMode ? "border-red-500/20 shadow-red-950/5" : "border-zinc-800"
            ].join(" ")}
            style={{
              width: orientation === "Portrait" ? `${595 * (zoom / 100)}px` : `${842 * (zoom / 100)}px`,
              minHeight: orientation === "Portrait" ? `${842 * (zoom / 100)}px` : `${595 * (zoom / 100)}px`,
              padding: getPaddingStyle(),
            }}
            onClick={handleRedactClick}
          >
            {/* Header text representation */}
            <div className="absolute top-4 left-6 right-6 border-b border-zinc-900/50 pb-1 text-[9px] text-zinc-500 font-mono flex justify-between select-none">
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="bg-transparent border-none text-zinc-500 font-mono text-[9px] outline-none focus:text-cyan-300 w-1/2"
                title="Double click to edit Header text"
              />
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
              id="editor-content"
              contentEditable
              suppressContentEditableWarning
              className="outline-none w-full h-full text-zinc-200 relative z-10 selection:bg-cyan-500/20"
              style={{
                fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                fontSize: "11pt",
                lineHeight: "1.6",
                minHeight: "560px",
                zoom: `${zoom}%`,
                columnCount: columns,
                columnGap: "24px"
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
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="bg-transparent border-none text-zinc-500 font-mono text-[9px] outline-none focus:text-cyan-300 w-2/3"
                title="Double click to edit Footer text"
              />
              {showPageNumbers && <span>Page 1 of ~{pageCount}</span>}
            </div>
          </div>
        </div>

        {/* Right Info Sidebar (when review tab is selected) */}
        {activeTab === "review" && (
          <aside className="w-64 border-l border-zinc-900 bg-zinc-950 p-4 space-y-4 select-none shrink-0 overflow-y-auto">
            {/* Readability Score */}
            <div className="space-y-1 bg-zinc-900/20 border border-zinc-900 p-3 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Readability Grade</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-cyan-300">{statsSummary.fleschScore}</span>
                <span className="text-[10px] text-zinc-400">/ 100</span>
              </div>
              <p className="text-[10px] text-zinc-500 italic leading-snug pt-1 border-t border-zinc-900">
                {statsSummary.fleschScore >= 90 ? "Very easy to read. 5th grade level." :
                 statsSummary.fleschScore >= 70 ? "Fairly easy language structure." :
                 statsSummary.fleschScore >= 50 ? "Standard corporate / standard ease." :
                 statsSummary.fleschScore >= 30 ? "Complex document metrics. Academic style." :
                 "Highly confusing. Professional level only."}
              </p>
            </div>

            {/* Statistics */}
            <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 p-3 rounded-xl text-[11px] font-mono">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider font-sans block mb-1">Document metrics</span>
              <div className="flex justify-between">
                <span className="text-zinc-500">Characters:</span>
                <span className="text-zinc-300 font-bold">{statsSummary.chars}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Words:</span>
                <span className="text-zinc-300 font-bold">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sentences:</span>
                <span className="text-zinc-300 font-bold">{statsSummary.sentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Paragraphs:</span>
                <span className="text-zinc-300 font-bold">{statsSummary.paragraphs}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-900 pt-1.5 mt-1 font-sans">
                <span className="text-zinc-500 text-[10px]">Read Time:</span>
                <span className="text-cyan-300 font-bold">~{statsSummary.readingTime} min</span>
              </div>
            </div>

            {/* Document Outline headings */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Document Outline</span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {docOutline.map((h, i) => (
                  <a
                    key={i}
                    href={`#${h.id}`}
                    className="block text-[11px] hover:text-cyan-300 transition truncate"
                    style={{ paddingLeft: `${(h.level - 1) * 8}px`, color: h.level === 1 ? "#22d3ee" : "#a1a1aa" }}
                  >
                    {h.level === 1 ? "• " : h.level === 2 ? "◦ " : "▪ "}{h.text}
                  </a>
                ))}
                {docOutline.length === 0 && (
                  <span className="text-[10px] text-zinc-650 italic block py-4 text-center">No headings mapped yet.</span>
                )}
              </div>
            </div>
          </aside>
        )}
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
