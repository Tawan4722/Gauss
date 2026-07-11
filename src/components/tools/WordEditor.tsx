'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Outdent, Indent, Undo, Redo, Image as ImageIcon, Table, Link as LinkIcon,
  FileText, Settings, HelpCircle, FileDown, PlusCircle, Scissors,
  Type, Palette, ClipboardList, Info, Calendar, Milestone,
  Printer, CheckSquare, Paintbrush, Search, Share, User, Star, Cloud, MessageSquare, Check, X,
  ChevronDown, ChevronRight, Keyboard, Languages, BookOpen, Settings2
} from "lucide-react"
import { exportToDocx } from "@/lib/tools/docxExporter"
import { importFromDocx } from "@/lib/tools/docxParser"
import { htmlToMarkdown, markdownToHtml } from "@/lib/tools/markdownConverter"

interface CommentReply {
  id: string
  author: string
  text: string
  createdAt: string
}

interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
  replies: CommentReply[]
  resolved: boolean
  highlightedText: string
  rangeId: string
  isDraft?: boolean
}

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
  docTitle?: string
  onRenameDoc?: (newTitle: string) => void
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

const FONTS = [
  "Geist Sans", "Arial", "Times New Roman", "Calibri", "Georgia", "Verdana", "Courier New", "Tahoma"
]

const SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"]

const COMMON_TYPOS: Record<string, string[]> = {
  teh: ["the"],
  recieve: ["receive"],
  seperate: ["separate"],
  accomodate: ["accommodate"],
  definetly: ["definitely"],
  wierd: ["weird"],
  calender: ["calendar"],
  goverment: ["government"],
  enviroment: ["environment"],
  neccessary: ["necessary"],
  untill: ["until"],
  tommorow: ["tomorrow"],
  truely: ["truly"],
  relevent: ["relevant"],
  oppurtunity: ["opportunity"],
  embarass: ["embarrass"],
  priviledge: ["privilege"],
  occured: ["occurred"],
  immediatly: ["immediately"],
  beleive: ["believe"],
  arguement: ["argument"],
  colleague: ["colleague"],
  possession: ["possession"],
  documnet: ["document"],
  formating: ["formatting"],
  libary: ["library"],
  accross: ["across"],
  adress: ["address"],
  commited: ["committed"],
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-800 mx-1 shrink-0 self-center" />
}

function downloadBlob(blob: Blob, name: string) {
  if (typeof window === "undefined") return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function WordEditor({
  editorRef,
  onInsertImage,
  wordCount,
  pageCount: passedPageCount,
  watermarkText,
  setWatermarkText,
  showPageNumbers,
  setShowPageNumbers,
  margins,
  setMargins,
  orientation,
  setOrientation,
  pageSize,
  setPageSize,
  docTitle = "Gauss Document Studio Workspace",
  onRenameDoc
}: WordEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  
  // Theme settings (Default to google docs light mode)
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light")
  
  // Dropdown States
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showSpacingMenu, setShowSpacingMenu] = useState(false)
  const [showTextColor, setShowTextColor] = useState(false)
  const [showBgColor, setShowBgColor] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [zoom, setZoom] = useState(100)

  // Outline
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([])
  const [showOutlineSidebar, setShowOutlineSidebar] = useState(true)

  // Floating word count toggle
  const [showWordCountFloat, setShowWordCountFloat] = useState(false)

  // Document background color options
  const [pageColor, setPageColor] = useState("#ffffff")

  // Header/Footer active states
  const [headerText, setHeaderText] = useState("GAUSS PRIVATE DOCUMENT")
  const [footerText, setFooterText] = useState("Confidential - Local-First Offline")

  // Redaction & stamp modes
  const [redactMode, setRedactMode] = useState(false)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [commentDraftText, setCommentDraftText] = useState("")
  const [replyDraftText, setReplyDraftText] = useState("")

  // Spellchecker states
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true)
  const [misspelledWords, setMisspelledWords] = useState<string[]>([])
  const [spellPopover, setSpellPopover] = useState<{
    visible: boolean
    word: string
    suggestions: string[]
    x: number
    y: number
  }>({ visible: false, word: "", suggestions: [], x: 0, y: 0 })

  // Modals
  const [modalOpen, setModalOpen] = useState<{
    share: boolean
    pageSetup: boolean
    wordCount: boolean
    shortcuts: boolean
    spellcheck: boolean
    findReplace: boolean
  }>({
    share: false,
    pageSetup: false,
    wordCount: false,
    shortcuts: false,
    spellcheck: false,
    findReplace: false
  })

  // Find & Replace
  const [findText, setFindText] = useState("")
  const [replaceText, setReplaceText] = useState("")
  const [matchCase, setMatchCase] = useState(false)
  const [matchWholeWord, setMatchWholeWord] = useState(false)
  const [findReplaceMsg, setFindReplaceMsg] = useState("")

  // Share properties
  const [shareConfig, setShareConfig] = useState({
    emails: "",
    permission: "Editor"
  })

  // Document outline builder
  const buildOutline = useCallback(() => {
    if (!editorRef.current) return
    const headings: { id: string; text: string; level: number }[] = []
    const nodes = editorRef.current.querySelectorAll("h1, h2, h3")
    nodes.forEach((node, idx) => {
      const el = node as HTMLElement
      let id = el.getAttribute("id")
      if (!id) {
        id = `heading-ref-${idx}`
        el.setAttribute("id", id)
      }
      headings.push({
        id,
        text: el.innerText || el.textContent || `Section ${idx + 1}`,
        level: el.tagName.toLowerCase() === "h1" ? 1 : el.tagName.toLowerCase() === "h2" ? 2 : 3
      })
    })
    setOutline(headings)
  }, [editorRef])

  useEffect(() => {
    buildOutline()
    // Scan every few seconds for outline changes
    const interval = setInterval(buildOutline, 5000)
    return () => clearInterval(interval)
  }, [buildOutline])

  // Formatting operations
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }, [editorRef])

  const triggerImportFile = useCallback(() => {
    importFileInputRef.current?.click()
  }, [])

  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const applyFont = (f: string) => {
    setShowFontMenu(false)
    exec("fontName", f)
  }

  const applyFontSize = (s: string) => {
    setShowSizeMenu(false)
    exec("styleWithCSS", "true")
    exec("fontSize", "7")
    const fontElements = editorRef.current?.querySelectorAll('font[size="7"]')
    fontElements?.forEach((el) => {
      ;(el as HTMLElement).removeAttribute("size")
      ;(el as HTMLElement).style.fontSize = `${s}pt`
    })
    exec("styleWithCSS", "false")
  }

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

  const clearFormatting = useCallback(() => {
    exec("removeFormat")
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const container = range.commonAncestorContainer
      const parent = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement
      if (parent && parent !== editorRef.current) {
        parent.removeAttribute("style")
      }
    }
  }, [exec, editorRef])

  // Insert Table
  const insertTable = (rows: number, cols: number) => {
    setShowTablePicker(false)
    editorRef.current?.focus()
    let html = `<table style="border-collapse:collapse;width:100%;margin:16px 0;border:1px solid ${editorTheme === 'light' ? '#cbd5e1' : '#3f3f46'}">`
    for (let r = 0; r < rows; r++) {
      html += "<tr>"
      for (let c = 0; c < cols; c++) {
        html += `<td style="border:1px solid ${editorTheme === 'light' ? '#cbd5e1' : '#3f3f46'};padding:12px;min-width:60px;color:inherit;vertical-align:top;">&nbsp;</td>`
      }
      html += "</tr>"
    }
    html += "</table><p><br></p>"
    document.execCommand("insertHTML", false, html)
  }

  // Comments implementation
  const addComment = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.toString().trim() === "") {
      alert("Please select some text in the document first to attach a comment.")
      return
    }
    const range = sel.getRangeAt(0)
    const commentId = `comment-${Date.now()}`
    
    const span = document.createElement("span")
    span.className = "google-docs-comment-highlight"
    span.setAttribute("data-comment-id", commentId)
    span.style.backgroundColor = "#fef08a" // yellow highlight
    span.style.color = "#000000"
    span.style.cursor = "pointer"

    try {
      range.surroundContents(span)
    } catch (err) {
      alert("Spans crossing boundary elements cannot be wrapped directly. Please comment within a single block.")
      return
    }

    sel.removeAllRanges()

    const newComment: Comment = {
      id: commentId,
      author: "Local Collaborator",
      text: "",
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replies: [],
      resolved: false,
      highlightedText: span.innerText,
      rangeId: commentId,
      isDraft: true
    }

    setComments(prev => [...prev, newComment])
    setActiveCommentId(commentId)
    setCommentDraftText("")
  }

  const saveCommentDraft = (id: string) => {
    if (!commentDraftText.trim()) return
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, text: commentDraftText, isDraft: false }
      }
      return c
    }))
    setCommentDraftText("")
  }

  const addReply = (commentId: string) => {
    if (!replyDraftText.trim()) return
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const reply: CommentReply = {
          id: `reply-${Date.now()}`,
          author: "Local Collaborator",
          text: replyDraftText,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return { ...c, replies: [...(c.replies || []), reply] }
      }
      return c
    }))
    setReplyDraftText("")
  }

  const resolveComment = (id: string) => {
    if (!editorRef.current) return
    const spans = editorRef.current.querySelectorAll(`span[data-comment-id="${id}"]`)
    spans.forEach(span => {
      const parent = span.parentNode
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span)
        }
        parent.removeChild(span)
      }
    })
    setComments(prev => prev.filter(c => c.id !== id))
    if (activeCommentId === id) setActiveCommentId(null)
  }

  const cancelCommentDraft = (id: string) => {
    resolveComment(id) // removes the highlight and placeholder comment
  }

  // Dictionary Spelling Checker
  const clearSpellCheckTags = useCallback(() => {
    if (!editorRef.current) return
    const spans = editorRef.current.querySelectorAll("span.google-docs-spell-error")
    spans.forEach(span => {
      const parent = span.parentNode
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span)
        }
        parent.removeChild(span)
      }
    })
    setMisspelledWords([])
  }, [editorRef])

  const runSpellCheck = useCallback(() => {
    if (!editorRef.current || !spellCheckEnabled) return
    
    // Clear tags first
    clearSpellCheckTags()

    const walkAndFlag = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ""
        // Split text by word boundary separators, capturing them to reconstruct nodes
        const words = text.split(/(\s+|,|\.|\?|!|;|:|–|—|\(|\)|"|')/)
        let replaced = false
        const newNodes: Node[] = []

        words.forEach(word => {
          const cleanWord = word.trim().toLowerCase().replace(/[^a-z]/g, "")
          if (cleanWord && COMMON_TYPOS[cleanWord]) {
            const span = document.createElement("span")
            span.className = "google-docs-spell-error"
            span.setAttribute("data-word", cleanWord)
            span.style.textDecoration = "underline red wavy"
            span.style.cursor = "pointer"
            span.innerText = word
            newNodes.push(span)
            replaced = true
          } else {
            newNodes.push(document.createTextNode(word))
          }
        })

        if (replaced && node.parentNode) {
          const parent = node.parentNode
          newNodes.forEach(newNode => {
            parent.insertBefore(newNode, node)
          })
          parent.removeChild(node)
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.className === "google-docs-spell-error" || el.className === "google-docs-comment-highlight") {
          return // don't re-annotate
        }
        Array.from(el.childNodes).forEach(walkAndFlag)
      }
    }

    walkAndFlag(editorRef.current)
    
    // Update state with current misspelled words list to avoid accessing refs during render
    const nodes = editorRef.current.querySelectorAll("span.google-docs-spell-error")
    setMisspelledWords(Array.from(nodes).map(n => n.textContent || ""))
  }, [editorRef, spellCheckEnabled, clearSpellCheckTags])

  useEffect(() => {
    if (spellCheckEnabled) {
      const handle = setTimeout(runSpellCheck, 1500)
      return () => clearTimeout(handle)
    } else {
      clearSpellCheckTags()
    }
  }, [spellCheckEnabled, runSpellCheck, clearSpellCheckTags])

  const handleEditorClickOrSelect = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Spelling mistake popup trigger
    if (target.classList.contains("google-docs-spell-error")) {
      const word = target.getAttribute("data-word") || ""
      const rect = target.getBoundingClientRect()
      const editorRect = editorRef.current?.getBoundingClientRect()
      if (editorRect) {
        editorRef.current?.querySelectorAll(".spell-error-active").forEach(el => el.classList.remove("spell-error-active"))
        target.classList.add("spell-error-active")
        
        setSpellPopover({
          visible: true,
          word,
          suggestions: COMMON_TYPOS[word] || ["Suggest Correction"],
          x: rect.left - editorRect.left + (rect.width / 2),
          y: rect.bottom - editorRect.top + 8
        })
      }
      return
    } else {
      setSpellPopover(prev => ({ ...prev, visible: false }))
      editorRef.current?.querySelectorAll(".spell-error-active").forEach(el => el.classList.remove("spell-error-active"))
    }

    // Comment click selection match
    if (target.classList.contains("google-docs-comment-highlight")) {
      const commentId = target.getAttribute("data-comment-id")
      if (commentId) {
        setActiveCommentId(commentId)
      }
      return
    }
  }

  const applySpellCorrection = (suggestion: string) => {
    const targetEl = editorRef.current?.querySelector(".spell-error-active") as HTMLElement | null
    if (targetEl) {
      targetEl.innerText = suggestion
      const parent = targetEl.parentNode
      if (parent) {
        while (targetEl.firstChild) {
          parent.insertBefore(targetEl.firstChild, targetEl)
        }
        parent.removeChild(targetEl)
      }
      setSpellPopover(prev => ({ ...prev, visible: false }))
      runSpellCheck()
    }
  }

  const ignoreSpellCheck = () => {
    const targetEl = editorRef.current?.querySelector(".spell-error-active") as HTMLElement | null
    if (targetEl) {
      const parent = targetEl.parentNode
      if (parent) {
        while (targetEl.firstChild) {
          parent.insertBefore(targetEl.firstChild, targetEl)
        }
        parent.removeChild(targetEl)
      }
      setSpellPopover(prev => ({ ...prev, visible: false }))
    }
  }

  // Find & Replace actions
  const handleFind = () => {
    if (!findText) return
    const found = (window as unknown as ExtendedWindow).find(findText, matchCase, false, true, matchWholeWord, false, false)
    if (!found) {
      setFindReplaceMsg("Phrase not found.")
    } else {
      setFindReplaceMsg("Occurrence selected.")
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
        setFindReplaceMsg("Replaced occurrence.")
        handleFind()
        return
      }
    }
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
    setFindReplaceMsg(`Replaced ${count} occurrences total.`)
  }

  // Import
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
        const text = await file.text()
        htmlContent = text.split("\n").map(l => `<p>${l}</p>`).join("")
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent
        buildOutline()
        runSpellCheck()
        alert(`Successfully imported: ${file.name}`)
      }
    } catch (err) {
      alert(`Error reading file: ${(err as Error)?.message || String(err)}`)
    }
    e.target.value = ""
  }

  // Export
  const handleExport = useCallback(async (format: "docx" | "pdf" | "html" | "md" | "txt") => {
    if (!editorRef.current) return
    const contentHtml = editorRef.current.innerHTML
    const contentText = editorRef.current.innerText

    if (format === "docx") {
      const blob = await exportToDocx(contentHtml, {
        pageSize,
        orientation,
        margins: margins as "normal" | "narrow" | "wide",
        watermarkText,
        headerText,
        footerText
      })
      downloadBlob(blob, `${docTitle}.docx`)
    } else if (format === "pdf") {
      window.print()
    } else if (format === "html") {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #111827; background-color: ${pageColor}; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; font-size: 24pt; }
    h2 { color: #1e3a8a; font-size: 18pt; margin-top: 24px; }
    h3 { color: #b45309; font-size: 14pt; }
    table { border-collapse: collapse; width: 100%; margin: 24px 0; }
    td, th { border: 1px solid #d1d5db; padding: 10px 14px; }
    .google-docs-comment-highlight { background-color: transparent !important; }
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
  }, [editorRef, pageSize, orientation, margins, watermarkText, headerText, footerText, docTitle, pageColor])



  // Setup defaults
  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML.trim()) return
    editorRef.current.innerHTML = `
      <h1 style="font-family:'Geist Sans';font-size:24pt;font-weight:bold;color:#1e3a8a;margin:0 0 16px;">Local Document Studio</h1>
      <p style="font-family:'Geist Sans';font-size:11pt;margin:0 0 12px;color:#374151;">Welcome to Gauss Document Studio. This workspace runs <strong>100% offline</strong> inside your browser sandbox.</p>
      <p style="font-family:'Geist Sans';font-size:11pt;margin:0 0 12px;color:#374151;">Write, format layouts, edit headers, insert tables, and draft comments securely.</p>
    `
  }, [editorRef])

  const getPaddingStyle = () => {
    if (margins === "narrow") return "0.5in 0.75in"
    if (margins === "wide") return "1.25in 1.5in"
    return "1.0in 1.25in"
  }

  // Redaction click handler
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

  // Spell Check List Sidepanel Review
  const getMisspelledWords = (): string[] => {
    return misspelledWords
  }

  // Mock Offline Document Translation
  const translateDoc = useCallback(() => {
    if (!editorRef.current) return
    let text = editorRef.current.innerHTML
    text = text.replace(/Local Document Studio/g, "สตูดิโอเอกสารโลคอล")
    text = text.replace(/Welcome to Gauss/g, "ยินดีต้อนรับสู่เกาส์")
    text = text.replace(/Confidential/g, "ความลับสูงสุด")
    editorRef.current.innerHTML = text
    buildOutline()
    alert("Document translated locally to Thai (Mock Layer) successfully!")
  }, [editorRef, buildOutline])

  // Double click menu close helper
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenu(null)
    }
    window.addEventListener("click", handleGlobalClick)
    return () => window.removeEventListener("click", handleGlobalClick)
  }, [])

  const menus = useMemo(() => [
    {
      name: "File",
      items: [
        { label: "New Blank Document", action: () => exec("insertHTML", "<h1>Untitled</h1><p>Start writing...</p>") },
        { label: "Import File...", action: triggerImportFile },
        { label: "divider" },
        { label: "Download DOCX", action: () => handleExport("docx") },
        { label: "Download PDF Print", action: () => handleExport("pdf") },
        { label: "Download Web HTML", action: () => handleExport("html") },
        { label: "Download Markdown", action: () => handleExport("md") },
        { label: "Download Plain Text", action: () => handleExport("txt") },
        { label: "divider" },
        { label: "Page Setup...", action: () => setModalOpen(prev => ({ ...prev, pageSetup: true })) },
        { label: "Print (Ctrl+P)", action: () => window.print() }
      ]
    },
    {
      name: "Edit",
      items: [
        { label: "Undo (Ctrl+Z)", action: () => exec("undo") },
        { label: "Redo (Ctrl+Y)", action: () => exec("redo") },
        { label: "divider" },
        { label: "Find and Replace...", action: () => setModalOpen(prev => ({ ...prev, findReplace: true })) }
      ]
    },
    {
      name: "View",
      items: [
        { label: "Print Layout view", action: () => {} },
        { label: "Toggle Document Outline", action: () => setShowOutlineSidebar(!showOutlineSidebar) },
        { label: "Show Word Count while typing", action: () => setShowWordCountFloat(!showWordCountFloat) },
        { label: "divider" },
        { label: "Switch Dark Theme", action: () => setEditorTheme(prev => prev === 'light' ? 'dark' : 'light') }
      ]
    },
    {
      name: "Insert",
      items: [
        { label: "Image Attachment...", action: triggerImageUpload },
        { label: "Table...", action: () => setShowTablePicker(!showTablePicker) },
        { label: "Hyperlink...", action: () => { const u = window.prompt("URL:"); if(u) exec("createLink", u) } },
        { label: "divider" },
        { label: "Page Break", action: () => exec("insertHTML", '<div class="google-docs-page-break" style="height: 12px; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; background-color: #f8f9fa; margin: 24px -1in; text-align: center; color: #9ca3af; font-size: 10px; line-height: 12px;" contenteditable="false">Page Break</div><p><br></p>') },
        { label: "Page Numbers", action: () => setShowPageNumbers(!showPageNumbers) },
        { label: "Header text edit", action: () => { const h = window.prompt("Header text:", headerText); if (h !== null) setHeaderText(h) } },
        { label: "Footer text edit", action: () => { const f = window.prompt("Footer text:", footerText); if (f !== null) setFooterText(f) } },
        { label: "Timestamp", action: () => exec("insertText", new Date().toLocaleString()) }
      ]
    },
    {
      name: "Format",
      items: [
        { label: "Bold (Ctrl+B)", action: () => exec("bold") },
        { label: "Italic (Ctrl+I)", action: () => exec("italic") },
        { label: "Underline (Ctrl+U)", action: () => exec("underline") },
        { label: "Strikethrough", action: () => exec("strikeThrough") },
        { label: "divider" },
        { label: "Superscript", action: () => exec("superscript") },
        { label: "Subscript", action: () => exec("subscript") },
        { label: "divider" },
        { label: "Clear Formatting", action: clearFormatting }
      ]
    },
    {
      name: "Tools",
      items: [
        { label: "Spelling and grammar check", action: () => setModalOpen(prev => ({ ...prev, spellcheck: true })) },
        { label: "Word Count modal", action: () => setModalOpen(prev => ({ ...prev, wordCount: true })) },
        { label: "Translate Document (Mock TH)", action: translateDoc }
      ]
    },
    {
      name: "Help",
      items: [
        { label: "Keyboard Shortcuts List", action: () => setModalOpen(prev => ({ ...prev, shortcuts: true })) },
        { label: "Help Guide", action: () => alert("Use standard menus and quick tool icons to structure documents, insert tables, and draft comments.") }
      ]
    }
  ], [exec, triggerImportFile, handleExport, setModalOpen, triggerImageUpload, setShowTablePicker, showTablePicker, setShowPageNumbers, showPageNumbers, headerText, footerText, setShowOutlineSidebar, showOutlineSidebar, setShowWordCountFloat, showWordCountFloat, setEditorTheme, clearFormatting, translateDoc])

  return (
    <div className={`flex flex-col w-full h-full select-none ${editorTheme === 'light' ? 'bg-[#f8f9fa] text-zinc-800' : 'bg-zinc-950 text-zinc-100'}`}>
      
      {/* 1. GOOGLE DOCS HEADER / TITLE BAR */}
      <div className="flex justify-between items-center px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* Docs Icon */}
          <div className="h-10 w-10 bg-blue-600 dark:bg-blue-700 flex items-center justify-center rounded-lg shadow-md cursor-pointer shrink-0">
            <FileText className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => onRenameDoc?.(e.target.value)}
                className="text-lg font-bold outline-none bg-transparent hover:bg-zinc-150 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded px-1.5 py-0.5 border border-transparent transition w-72 truncate dark:focus:bg-zinc-850"
                placeholder="Untitled Document"
              />
              <button className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-yellow-500 hover:text-yellow-600">
                <Star className="h-4 w-4 fill-current" />
              </button>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                <Cloud className="h-3 w-3 text-blue-500" />
                <span>Saved Offline</span>
              </div>
            </div>

            {/* GOOGLE DOCS MENUS */}
            <div className="flex gap-1.5 mt-0.5 relative text-xs">
              {/* eslint-disable-next-line react-hooks/refs */}
              {menus.map((menu) => (
                <div key={menu.name} className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMenu(activeMenu === menu.name ? null : menu.name)
                    }}
                    className={`px-2.5 py-1.5 rounded font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${activeMenu === menu.name ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-300'}`}
                  >
                    {menu.name}
                  </button>

                  {activeMenu === menu.name && (
                    <div className="absolute left-0 mt-1 z-50 py-1 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl min-w-56 overflow-hidden">
                      {menu.items.map((item, idx) => {
                        if (item.label === "divider") {
                          return <div key={idx} className="h-px bg-zinc-150 dark:bg-zinc-850 my-1" />
                        }
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveMenu(null)
                              if (item.action) item.action()
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[11px] text-zinc-700 dark:text-zinc-300 flex justify-between items-center"
                          >
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Share Button & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(prev => ({ ...prev, share: true }))}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Share className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
          
          <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-full flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-300">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 2. QUICK TOOLBAR */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-wrap overflow-x-auto shrink-0 select-none">
        
        {/* Undo/Redo */}
        <button title="Undo" onClick={() => exec("undo")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><Undo className="h-3.5 w-3.5" /></button>
        <button title="Redo" onClick={() => exec("redo")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><Redo className="h-3.5 w-3.5" /></button>
        
        {/* Print */}
        <button title="Print" onClick={() => window.print()} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><Printer className="h-3.5 w-3.5" /></button>

        {/* Spelling Toggle */}
        <button 
          title="Spell Checker Check" 
          onClick={() => {
            setSpellCheckEnabled(!spellCheckEnabled)
            if(!spellCheckEnabled) runSpellCheck()
          }} 
          className={`p-1.5 rounded hover:bg-zinc-205 dark:hover:bg-zinc-800 ${spellCheckEnabled ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20' : 'text-zinc-500'}`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
        </button>

        <Divider />

        {/* Zoom */}
        <div className="relative">
          <button
            onClick={() => setZoom(prev => prev === 100 ? 120 : prev === 120 ? 150 : prev === 150 ? 75 : 100)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-300"
          >
            <span>{zoom}%</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <Divider />

        {/* Style Selection */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStyleMenu(!showStyleMenu)
              setShowFontMenu(false)
              setShowSizeMenu(false)
              setShowAlignMenu(false)
              setShowSpacingMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-300"
          >
            <span>Normal Text</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showStyleMenu && (
            <div className="absolute z-50 mt-1 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-36 select-none font-sans">
              {[
                { label: "Normal text", tag: "p" },
                { label: "Title", tag: "h1", size: "24pt" },
                { label: "Subtitle", tag: "p", size: "14pt" },
                { label: "Heading 1", tag: "h1" },
                { label: "Heading 2", tag: "h2" },
                { label: "Heading 3", tag: "h3" }
              ].map((style) => (
                <button
                  key={style.label}
                  type="button"
                  onClick={() => {
                    setShowStyleMenu(false)
                    exec("formatBlock", style.tag)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-900 transition"
                >
                  {style.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFontMenu(!showFontMenu)
              setShowStyleMenu(false)
              setShowSizeMenu(false)
              setShowAlignMenu(false)
              setShowSpacingMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-zinc-205 dark:hover:bg-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-300"
          >
            <span className="truncate max-w-16">Arial</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showFontMenu && (
            <div className="absolute z-50 mt-1 py-1 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-44 select-none font-sans">
              {FONTS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => applyFont(f)}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Size Selection */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => applyFontSize("10")} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-650">-</button>
          <div className="relative">
            <button
              onClick={() => {
                setShowSizeMenu(!showSizeMenu)
                setShowStyleMenu(false)
                setShowFontMenu(false)
                setShowAlignMenu(false)
                setShowSpacingMenu(false)
              }}
              className="px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded text-xs font-bold text-zinc-600 dark:text-zinc-300 min-w-8 text-center"
            >
              11
            </button>
            {showSizeMenu && (
              <div className="absolute z-50 mt-1 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg max-h-48 overflow-y-auto w-14">
                {SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyFontSize(s)}
                    className="w-full text-center py-1 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => applyFontSize("12")} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-650">+</button>
        </div>

        <Divider />

        {/* Style Controls */}
        <button title="Bold (Ctrl+B)" onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><Bold className="h-3.5 w-3.5" /></button>
        <button title="Italic (Ctrl+I)" onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><Italic className="h-3.5 w-3.5" /></button>
        <button title="Underline (Ctrl+U)" onClick={() => exec("underline")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><Underline className="h-3.5 w-3.5" /></button>
        <button title="Strikethrough" onClick={() => exec("strikeThrough")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650"><Strikethrough className="h-3.5 w-3.5" /></button>

        {/* Text color and highlight */}
        <div className="relative">
          <button
            title="Text Color"
            onClick={() => { setShowTextColor(!showTextColor); setShowBgColor(false) }}
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-0.5"
          >
            <Type className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <div className="w-2.5 h-1 bg-red-600 rounded-sm" />
          </button>
          {showTextColor && (
            <div className="absolute z-50 mt-1 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl grid grid-cols-5 gap-1 select-none">
              {["#000000", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#111827", "#ffffff"].map(c => (
                <button
                  key={c}
                  title={c}
                  onMouseDown={(e) => { e.preventDefault(); applyTextColor(c) }}
                  className="w-5 h-5 rounded border border-zinc-200 hover:border-zinc-400 hover:scale-110 transition"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            title="Highlight Color"
            onClick={() => { setShowBgColor(!showBgColor); setShowTextColor(false) }}
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-0.5"
          >
            <Palette className="h-3.5 w-3.5 text-yellow-550" />
            <div className="w-2.5 h-1 bg-yellow-350 rounded-sm" />
          </button>
          {showBgColor && (
            <div className="absolute z-50 mt-1 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl grid grid-cols-5 gap-1 select-none">
              {["inherit", "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#ddd6fe", "#fed7aa", "#cbd5e1", "#fca5a5", "#a5f3fc"].map(c => (
                <button
                  key={c}
                  title={c === "inherit" ? "Clear" : c}
                  onMouseDown={(e) => { e.preventDefault(); applyHighlightColor(c) }}
                  className="w-5 h-5 rounded border border-zinc-200 hover:border-zinc-400 hover:scale-110 transition"
                  style={{ backgroundColor: c === "inherit" ? "transparent" : c }}
                />
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Hyperlink */}
        <button
          title="Insert Link"
          onClick={() => {
            const url = window.prompt("Insert Link URL:", "https://")
            if (url) exec("createLink", url)
          }}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {/* Add comment */}
        <button
          title="Add comment"
          onClick={addComment}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>

        {/* Image upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) onInsertImage(file)
            e.target.value = ""
          }}
        />
        {/* Import file upload */}
        <input
          ref={importFileInputRef}
          type="file"
          accept=".docx,.md,.html,.htm,.txt,text/*"
          className="hidden"
          onChange={handleImportFile}
        />
        <button
          title="Insert Image"
          onClick={() => imageInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>

        <Divider />

        {/* Alignment */}
        <div className="relative">
          <button
            title="Align"
            onClick={() => {
              setShowAlignMenu(!showAlignMenu)
              setShowStyleMenu(false)
              setShowFontMenu(false)
              setShowSizeMenu(false)
              setShowSpacingMenu(false)
            }}
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          {showAlignMenu && (
            <div className="absolute z-50 mt-1 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl grid grid-cols-4 gap-0.5 p-1 w-32">
              <button title="Align Left" onClick={() => { setShowAlignMenu(false); exec("justifyLeft") }} className="p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"><AlignLeft className="h-3.5 w-3.5" /></button>
              <button title="Align Center" onClick={() => { setShowAlignMenu(false); exec("justifyCenter") }} className="p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"><AlignCenter className="h-3.5 w-3.5" /></button>
              <button title="Align Right" onClick={() => { setShowAlignMenu(false); exec("justifyRight") }} className="p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"><AlignRight className="h-3.5 w-3.5" /></button>
              <button title="Justify" onClick={() => { setShowAlignMenu(false); exec("justifyFull") }} className="p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"><AlignJustify className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {/* Spacing */}
        <div className="relative">
          <button
            title="Line & paragraph spacing"
            onClick={() => {
              setShowSpacingMenu(!showSpacingMenu)
              setShowStyleMenu(false)
              setShowFontMenu(false)
              setShowSizeMenu(false)
              setShowAlignMenu(false)
            }}
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Paintbrush className="h-3.5 w-3.5" />
          </button>
          {showSpacingMenu && (
            <div className="absolute z-50 mt-1 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-32 select-none font-sans text-xs">
              {[
                { label: "Single", height: "1.0" },
                { label: "1.15 spacing", height: "1.15" },
                { label: "1.5 spacing", height: "1.5" },
                { label: "Double spacing", height: "2.0" }
              ].map(sp => (
                <button
                  key={sp.label}
                  type="button"
                  onClick={() => {
                    setShowSpacingMenu(false)
                    if (editorRef.current) {
                      editorRef.current.style.lineHeight = sp.height
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                >
                  {sp.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Lists */}
        <button title="Bullet list" onClick={() => exec("insertUnorderedList")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650"><List className="h-3.5 w-3.5" /></button>
        <button title="Numbered list" onClick={() => exec("insertOrderedList")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-655"><ListOrdered className="h-3.5 w-3.5" /></button>
        <button title="Decrease indent" onClick={() => exec("outdent")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650"><Outdent className="h-3.5 w-3.5" /></button>
        <button title="Increase indent" onClick={() => exec("indent")} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650"><Indent className="h-3.5 w-3.5" /></button>
        <button title="Clear formatting" onClick={clearFormatting} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-red-500"><X className="h-3.5 w-3.5" /></button>

        {/* Redact */}
        <button
          title="Toggle Redaction Brush"
          onClick={() => setRedactMode(!redactMode)}
          className={`p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 ${redactMode ? 'bg-red-55/20 text-red-500 border border-red-500/20 animate-pulse' : 'text-zinc-600 dark:text-zinc-300'}`}
        >
          <Scissors className="h-3.5 w-3.5" />
        </button>

        {/* Theme Switching */}
        <button
          title="Switch Canvas Theme"
          onClick={() => setEditorTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-blue-500"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>

        {/* Table selector */}
        <div className="relative">
          <button
            title="Quick Table"
            onClick={() => setShowTablePicker(!showTablePicker)}
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650"
          >
            <Table className="h-3.5 w-3.5" />
          </button>
          {showTablePicker && (
            <div className="absolute z-50 mt-1 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl select-none w-44 font-sans text-xs">
              <div className="font-bold text-zinc-400 mb-1.5">Insert Grid Table</div>
              <div className="grid grid-cols-5 gap-1 border border-zinc-205 dark:border-zinc-850 p-1 rounded">
                {Array.from({ length: 5 }, (_, rIdx) => {
                  const r = rIdx + 1
                  return Array.from({ length: 5 }, (_, cIdx) => {
                    const c = cIdx + 1
                    return (
                      <div
                        key={`${r}-${c}`}
                        title={`${r}x${c}`}
                        onClick={() => insertTable(r, c)}
                        className="w-5 h-5 border border-zinc-200 dark:border-zinc-850 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition rounded-sm"
                      />
                    )
                  })
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. MAIN EDITOR CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Outline Sidebar */}
        {showOutlineSidebar && (
          <aside className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shrink-0 overflow-y-auto space-y-3 hidden md:block">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Document Outline</div>
            <div className="space-y-2 mt-1">
              {outline.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  className="block text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition truncate"
                  style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                >
                  {h.text}
                </a>
              ))}
              {outline.length === 0 && (
                <span className="text-[10px] text-zinc-450 italic block py-4 text-center">Outline is empty. Use Headings (H1, H2, H3).</span>
              )}
            </div>
          </aside>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-auto py-8 px-4 flex justify-center relative bg-[#f8f9fa] dark:bg-zinc-950">
          
          <div className="flex flex-col items-center gap-6 min-h-max max-w-full relative">
            
            {/* Header text */}
            <div className="w-full flex justify-between px-6 text-[10px] text-zinc-400 font-mono tracking-widest uppercase select-none border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-1.5">
              <span>Header: {headerText}</span>
              <span>Double click menu to edit</span>
            </div>

            {/* Paper Container */}
            <div
              id="editor-paper-container"
              onClick={handleEditorClickOrSelect}
              className={`relative transition-all duration-200 select-text rounded border shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] ${
                editorTheme === 'light' 
                  ? 'bg-white border-zinc-200 text-zinc-800' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100'
              }`}
              style={{
                width: orientation === "Portrait" ? `${620 * (zoom / 100)}px` : `${860 * (zoom / 100)}px`,
                minHeight: orientation === "Portrait" ? `${880 * (zoom / 100)}px` : `${620 * (zoom / 100)}px`,
                padding: getPaddingStyle(),
                backgroundColor: editorTheme === 'light' ? pageColor : undefined
              }}
            >
              {/* Watermark */}
              {watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03] z-0">
                  <span className="font-black select-none transform -rotate-30 tracking-widest text-center uppercase text-[7vw] text-blue-500">
                    {watermarkText}
                  </span>
                </div>
              )}

              {/* Spelling popup */}
              {spellPopover.visible && (
                <div 
                  className="absolute z-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg shadow-xl w-44 font-sans text-xs flex flex-col gap-1.5 text-zinc-850 dark:text-zinc-200 select-none animate-in fade-in zoom-in-95 duration-100"
                  style={{ left: `${spellPopover.x}px`, top: `${spellPopover.y}px`, transform: 'translateX(-50%)' }}
                >
                  <div className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Suggested Spelling:</div>
                  <div className="flex flex-col gap-1">
                    {spellPopover.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => applySpellCorrection(s)}
                        className="w-full text-left px-2 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition font-bold"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-zinc-150 dark:bg-zinc-800 my-0.5" />
                  <div className="flex gap-2 justify-between">
                    <button onClick={ignoreSpellCheck} className="text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300 font-bold text-[10px]">Ignore</button>
                    <button onClick={ignoreSpellCheck} className="text-zinc-450 hover:text-zinc-700 font-bold text-[10px]">Add to Dict</button>
                  </div>
                </div>
              )}

              {/* Content Editable Area */}
              <div
                ref={editorRef}
                id="editor-content"
                contentEditable
                suppressContentEditableWarning
                onClick={handleRedactClick}
                onInput={() => {
                  buildOutline()
                  if(spellCheckEnabled) runSpellCheck()
                }}
                className="outline-none w-full h-full relative z-10 selection:bg-blue-100 dark:selection:bg-blue-950/30 min-h-[700px] leading-relaxed"
                style={{
                  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
                  fontSize: "11pt",
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
            </div>

            {/* Footer text */}
            <div className="w-full flex justify-between px-6 text-[10px] text-zinc-400 font-mono tracking-widest uppercase select-none border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-1.5 mb-8">
              <span>Footer: {footerText}</span>
              {showPageNumbers && <span>Page 1 of ~{passedPageCount}</span>}
            </div>

          </div>
        </div>

        {/* Comments Sidebar */}
        <aside className="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shrink-0 overflow-y-auto space-y-3">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider select-none">
            <span>Comments</span>
            <button onClick={addComment} className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px]">Add new</button>
          </div>
          
          <div className="space-y-3 mt-2">
            {comments.map(c => (
              <div 
                key={c.id} 
                className={`p-3 rounded-xl border transition-all text-xs ${
                  activeCommentId === c.id 
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10' 
                    : 'border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-900/20'
                }`}
                onClick={() => setActiveCommentId(c.id)}
              >
                <div className="flex justify-between font-bold text-[10px] text-zinc-500 mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300">{c.author}</span>
                  <span>{c.createdAt}</span>
                </div>
                
                <div className="text-zinc-450 italic border-l-2 border-zinc-300 dark:border-zinc-700 pl-2 py-0.5 my-1.5 text-[10px] truncate">
                  &quot;{c.highlightedText}&quot;
                </div>

                {c.isDraft ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      placeholder="Comment text..."
                      value={commentDraftText}
                      onChange={(e) => setCommentDraftText(e.target.value)}
                      className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      rows={2}
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => cancelCommentDraft(c.id)} className="px-2.5 py-1 text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-550 rounded transition">Cancel</button>
                      <button onClick={() => saveCommentDraft(c.id)} className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-750 transition">Comment</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-1">
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium">{c.text}</p>
                    
                    {/* Replies */}
                    {c.replies?.map(r => (
                      <div key={r.id} className="pl-3 border-l border-zinc-200 dark:border-zinc-800 py-1 space-y-0.5 text-[11px]">
                        <div className="flex justify-between font-bold text-[9px] text-zinc-450">
                          <span>{r.author}</span>
                          <span>{r.createdAt}</span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-450">{r.text}</p>
                      </div>
                    ))}

                    {/* Reply Input */}
                    {activeCommentId === c.id && (
                      <div className="space-y-1.5 pt-1.5 border-t border-zinc-150 dark:border-zinc-850 mt-2">
                        <input
                          type="text"
                          placeholder="Reply..."
                          value={replyDraftText}
                          onChange={(e) => setReplyDraftText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") addReply(c.id) }}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 rounded text-[11px] focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => resolveComment(c.id)} className="text-[10px] text-red-500 font-bold hover:underline flex-1 text-left py-0.5">Resolve</button>
                          <button onClick={() => addReply(c.id)} className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition">Reply</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-[10px] text-zinc-650 italic text-center py-6">No active comments. Highlight text and click &apos;Add comment&apos;.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Live word count display */}
      {showWordCountFloat && (
        <div className="fixed bottom-10 left-6 z-40 p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl rounded-lg text-[10px] font-mono flex items-center gap-3 text-zinc-600 dark:text-zinc-400 cursor-pointer hover:border-blue-400" onClick={() => setModalOpen(prev => ({ ...prev, wordCount: true }))}>
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{passedPageCount} page{passedPageCount !== 1 ? 's' : ''}</span>
          <X className="h-3 w-3 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setShowWordCountFloat(false) }} />
        </div>
      )}

      {/* SHARE MODAL */}
      {modalOpen.share && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-[450px] border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-955 text-zinc-800 dark:text-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Share with collaborators</span>
              <button onClick={() => setModalOpen(prev => ({ ...prev, share: false }))} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-450"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Add people (email addresses separated by commas):</label>
                <input
                  type="text"
                  value={shareConfig.emails}
                  onChange={(e) => setShareConfig(prev => ({ ...prev, emails: e.target.value }))}
                  placeholder="e.g. teammate@gauss.local, editor@gauss.local"
                  className="w-full p-2.5 border border-zinc-250 rounded-xl bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-blue-500 outline-none text-zinc-700 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Permissions Role:</label>
                <select
                  value={shareConfig.permission}
                  onChange={(e) => setShareConfig(prev => ({ ...prev, permission: e.target.value }))}
                  className="w-full p-2.5 border border-zinc-250 rounded-xl bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-blue-500 outline-none text-zinc-700 dark:text-zinc-300"
                >
                  <option value="Viewer">Viewer (Read Only)</option>
                  <option value="Commenter">Commenter (Add remarks)</option>
                  <option value="Editor">Editor (Full permissions)</option>
                </select>
              </div>
              <div className="border border-blue-500/10 bg-blue-500/5 p-3.5 rounded-xl text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                🔒 Security Note: This project operates 100% offline. Shared config layers are simulated on local-first browser networks.
              </div>
            </div>
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 flex justify-between">
              <button 
                onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Local share link copied!") }}
                className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 rounded-xl text-xs font-bold text-zinc-550 transition"
              >
                Copy Link
              </button>
              <div className="flex gap-2">
                <button onClick={() => setModalOpen(prev => ({ ...prev, share: false }))} className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-455 hover:bg-zinc-100 transition">Cancel</button>
                <button 
                  onClick={() => { setModalOpen(prev => ({ ...prev, share: false })); alert("Collaborator invited successfully!") }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE SETUP MODAL */}
      {modalOpen.pageSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-[450px] border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Page Setup</span>
              <button onClick={() => setModalOpen(prev => ({ ...prev, pageSetup: false }))} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-450"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400">Orientation:</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setOrientation("Portrait")}
                      className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${orientation === 'Portrait' ? 'border-blue-500 bg-blue-50/20 text-blue-600' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50'}`}
                    >
                      Portrait
                    </button>
                    <button
                      onClick={() => setOrientation("Landscape")}
                      className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${orientation === 'Landscape' ? 'border-blue-500 bg-blue-50/20 text-blue-600' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50'}`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400">Paper Size:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as "A4" | "Letter" | "Legal")}
                    className="w-full mt-1 p-2 border border-zinc-250 rounded-lg bg-zinc-50 dark:bg-zinc-900 outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="A4">A4 (8.3&quot; x 11.7&quot;)</option>
                    <option value="Letter">Letter (8.5&quot; x 11&quot;)</option>
                    <option value="Legal">Legal (8.5&quot; x 14&quot;)</option>
                  </select>
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Margins Preset:</label>
                <div className="flex gap-2">
                  {[
                    { id: "normal", label: "Normal (1 inch)" },
                    { id: "narrow", label: "Narrow (0.5 inch)" },
                    { id: "wide", label: "Wide (1.25 inch)" }
                  ].map(mPreset => (
                    <button
                      key={mPreset.id}
                      onClick={() => setMargins(mPreset.id)}
                      className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${margins === mPreset.id ? 'border-blue-500 bg-blue-50/20 text-blue-600' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50'}`}
                    >
                      {mPreset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Background */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Page Background Color:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pageColor}
                    onChange={(e) => setPageColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border border-zinc-250 p-0"
                  />
                  <div className="flex gap-1.5">
                    {["#ffffff", "#fefefc", "#fcfbf7", "#f5f6f8", "#ecfdf5", "#eff6ff"].map(c => (
                      <button
                        key={c}
                        onClick={() => setPageColor(c)}
                        className="w-6 h-6 rounded-full border border-zinc-200 hover:scale-105 transition"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2">
              <button onClick={() => setModalOpen(prev => ({ ...prev, pageSetup: false }))} className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-455 hover:bg-zinc-100 transition">Cancel</button>
              <button onClick={() => setModalOpen(prev => ({ ...prev, pageSetup: false }))} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* WORD COUNT MODAL */}
      {modalOpen.wordCount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-[380px] border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-955 text-zinc-800 dark:text-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Word Count</span>
              <button onClick={() => setModalOpen(prev => ({ ...prev, wordCount: false }))} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-450"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2">
                <span className="text-zinc-500">Pages:</span>
                <span className="font-bold">{passedPageCount}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2">
                <span className="text-zinc-500">Words:</span>
                <span className="font-bold">{wordCount}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2">
                <span className="text-zinc-500">Characters (with spaces):</span>
                <span className="font-bold">{(wordCount * 5.6) | 0}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-zinc-500">Paragraphs:</span>
                <span className="font-bold">{Math.max(1, Math.ceil(wordCount / 45))}</span>
              </div>
              
              <label className="flex items-center gap-2 mt-4 pt-2 border-t border-zinc-200 dark:border-zinc-850 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWordCountFloat}
                  onChange={(e) => setShowWordCountFloat(e.target.checked)}
                  className="rounded text-blue-650 focus:ring-blue-500 outline-none"
                />
                <span className="text-zinc-650 dark:text-zinc-400 font-medium">Show word count while typing</span>
              </label>
            </div>
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 flex justify-end">
              <button onClick={() => setModalOpen(prev => ({ ...prev, wordCount: false }))} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FIND & REPLACE MODAL */}
      {modalOpen.findReplace && (
        <div className="fixed top-28 right-16 z-50 p-4 border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 shadow-2xl rounded-2xl w-80 font-sans text-xs flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-150">
          <div className="flex justify-between items-center font-bold text-zinc-500 border-b border-zinc-150 dark:border-zinc-850 pb-1.5">
            <span className="text-blue-600 dark:text-blue-400 uppercase tracking-widest text-[10px]">Find and Replace</span>
            <button onClick={() => setModalOpen(prev => ({ ...prev, findReplace: false }))} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400 hover:text-zinc-600"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-[10px]">Find:</label>
              <input
                type="text"
                placeholder="Find..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 rounded-lg outline-none w-full text-zinc-700 dark:text-zinc-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-[10px]">Replace with:</label>
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 rounded-lg outline-none w-full text-zinc-700 dark:text-zinc-300"
              />
            </div>
            
            <div className="flex gap-3 items-center mt-1">
              <label className="flex items-center gap-1 cursor-pointer text-zinc-500 font-bold">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Aa</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-zinc-500 font-bold">
                <input
                  type="checkbox"
                  checked={matchWholeWord}
                  onChange={(e) => setMatchWholeWord(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>&quot;W&quot;</span>
              </label>
            </div>

            {findReplaceMsg && (
              <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono italic">{findReplaceMsg}</span>
            )}
          </div>
          <div className="flex gap-1.5 justify-end mt-2 pt-2 border-t border-zinc-150 dark:border-zinc-850">
            <button onClick={handleFind} className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-850 rounded hover:bg-zinc-55 dark:hover:bg-zinc-800 transition">Find</button>
            <button onClick={handleReplace} className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-850 rounded hover:bg-zinc-55 dark:hover:bg-zinc-800 transition">Replace</button>
            <button onClick={handleReplaceAll} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-bold">All</button>
          </div>
        </div>
      )}

      {/* SPELLING MODAL */}
      {modalOpen.spellcheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-[420px] border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Spelling & Grammar Review</span>
              <button onClick={() => setModalOpen(prev => ({ ...prev, spellcheck: false }))} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-450"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Document check list:</div>
              {getMisspelledWords().length > 0 ? (
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {getMisspelledWords().map((word, idx) => (
                    <div key={idx} className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-55/50 dark:bg-zinc-900/10 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="text-zinc-500 font-bold">Unrecognized Word:</div>
                        <div className="font-mono text-red-500 text-sm line-through">{word}</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Suggested correction: <strong className="text-blue-600 dark:text-blue-400 font-bold">{COMMON_TYPOS[word.toLowerCase().replace(/[^a-z]/g, "")]?.[0] || "Confirm Spelling"}</strong></div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const correction = COMMON_TYPOS[word.toLowerCase().replace(/[^a-z]/g, "")]?.[0]
                            if (correction && editorRef.current) {
                              const spans = editorRef.current.querySelectorAll("span.google-docs-spell-error")
                              spans.forEach(span => {
                                if (span.textContent?.toLowerCase().replace(/[^a-z]/g, "") === word.toLowerCase().replace(/[^a-z]/g, "")) {
                                  span.textContent = correction
                                  const parent = span.parentNode
                                  if (parent) {
                                    while (span.firstChild) parent.insertBefore(span.firstChild, span)
                                    parent.removeChild(span)
                                  }
                                }
                              })
                              runSpellCheck()
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => {
                            if (editorRef.current) {
                              const spans = editorRef.current.querySelectorAll("span.google-docs-spell-error")
                              spans.forEach(span => {
                                if (span.textContent?.toLowerCase().replace(/[^a-z]/g, "") === word.toLowerCase().replace(/[^a-z]/g, "")) {
                                  const parent = span.parentNode
                                  if (parent) {
                                    while (span.firstChild) parent.insertBefore(span.firstChild, span)
                                    parent.removeChild(span)
                                  }
                                }
                              })
                            }
                          }}
                          className="px-3 py-1 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded text-center"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-450 italic">
                  ✓ Document review complete! No unrecognized words or typos found.
                </div>
              )}
            </div>
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 flex justify-end">
              <button onClick={() => setModalOpen(prev => ({ ...prev, spellcheck: false }))} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS */}
      {modalOpen.shortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-[380px] border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Keyboard Shortcuts</span>
              <button onClick={() => setModalOpen(prev => ({ ...prev, shortcuts: false }))} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-450"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-3 text-xs font-mono text-zinc-650 dark:text-zinc-400">
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-1.5">
                <span>Bold</span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + B</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-1.5">
                <span>Italic</span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + I</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-1.5">
                <span>Underline</span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + U</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-1.5">
                <span>Undo</span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + Z</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-1.5">
                <span>Redo</span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + Y</span>
              </div>
              <div className="flex justify-between pb-1.5">
                <span>Find and Replace</span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + F</span>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 flex justify-end">
              <button onClick={() => setModalOpen(prev => ({ ...prev, shortcuts: false }))} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
