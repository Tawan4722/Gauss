'use client'

import { useRef, useEffect, useCallback, useState } from "react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface WordEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  files: File[]
  onInsertImage: (file: File) => void
  wordCount: number
  pageCount: number
}

// ─── Helper: toolbar divider ─────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-7 bg-[#d0d0d0] mx-1 shrink-0 self-center" />
}

// ─── Helper: ribbon icon button ───────────────────────────────────────────────

function RibbonBtn({
  title,
  onClick,
  active,
  children,
  wide,
  danger,
}: {
  title: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  wide?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()          // keep editor focus
        onClick()
      }}
      className={[
        "flex items-center justify-center rounded select-none transition-all text-[11px] font-medium",
        wide ? "px-2.5 h-7" : "h-7 w-7",
        active
          ? "bg-[#c9d8f0] border border-[#a0b9db] text-[#0f3557]"
          : danger
            ? "text-red-600 hover:bg-red-50 border border-transparent"
            : "text-[#1f1f1f] hover:bg-[#e5e5e5] border border-transparent",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

// ─── Helper: select control ────────────────────────────────────────────────

function RibbonSelect({
  value,
  onChange,
  options,
  width,
  title,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  width?: string
  title?: string
}) {
  return (
    <select
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      className={`h-7 border border-[#ccc] bg-white text-[11px] text-[#1f1f1f] rounded px-1.5 outline-none focus:border-[#1d5fa6] hover:border-[#a0a0a0] cursor-pointer transition-colors ${width ?? "w-32"}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ─── Color picker inline ──────────────────────────────────────────────────────

function ColorPicker({
  label,
  command,
}: {
  label: string
  command: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        title={label}
        onMouseDown={(e) => {
          e.preventDefault()
          ref.current?.click()
        }}
        className="h-7 w-7 flex flex-col items-center justify-center gap-0.5 rounded hover:bg-[#e5e5e5] transition"
      >
        <span className="text-[11px] font-bold text-[#1f1f1f] leading-none">A</span>
        <span
          className="w-4 h-1 rounded-sm block"
          style={{ backgroundColor: command === "foreColor" ? "#f00" : "#ff0" }}
        />
      </button>
      <input
        ref={ref}
        type="color"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onChange={(e) => {
          document.execCommand(command, false, e.target.value)
        }}
      />
    </div>
  )
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const Icons = {
  Bold: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M4 2h4.5a3 3 0 0 1 2.213 5.023A3.5 3.5 0 0 1 8.5 14H4zm2 5.5h2.5a1.5 1.5 0 0 0 0-3H6zm0 2V12h2.5a1.5 1.5 0 0 0 0-3z"/></svg>,
  Italic: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M7.5 2h4l-.5 2h-1.5L7 12h1.5l-.5 2h-4l.5-2H6l2.5-8H7z"/></svg>,
  Underline: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M8 10a3 3 0 0 0 3-3V2h-2v5a1 1 0 0 1-2 0V2H5v5a3 3 0 0 0 3 3zm-4 2h8v1H4z"/></svg>,
  Strikethrough: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 8h14v1H1zM6.5 2h3a2.5 2.5 0 0 1 2.5 2.5H10a1 1 0 0 0-1-1H7a1 1 0 0 0 0 2h2a3 3 0 0 1 0 6H5.5A2.5 2.5 0 0 1 3 9h2a1 1 0 0 0 1 1h3a1 1 0 0 0 0-2H7a3 3 0 0 1-3-3 2.5 2.5 0 0 1 2.5-3z"/></svg>,
  AlignLeft: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 2h14v1H1zm0 3h9v1H1zm0 3h14v1H1zm0 3h9v1H1z"/></svg>,
  AlignCenter: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 2h14v1H1zm2 3h10v1H3zm-2 3h14v1H1zm2 3h10v1H3z"/></svg>,
  AlignRight: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 2h14v1H1zm5 3h9v1H6zm-5 3h14v1H1zm5 3h9v1H6z"/></svg>,
  AlignJustify: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 2h14v1H1zm0 3h14v1H1zm0 3h14v1H1zm0 3h14v1H1z"/></svg>,
  ListUL: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><circle cx="2.5" cy="4" r="1"/><path d="M5 3.5h10v1H5zm-2.5 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2.5.5h10v1H5zm-2.5 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2.5.5h10v1H5z"/></svg>,
  ListOL: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M2 2h1v3H2V3H1V2zM5 3.5h9v1H5zm-3 4.5h2v.5H3V9h1.5v.5H3v.5h2V11H2zm3 .5h9v1H5zm-3 4h2v.5H3v.5h2V14H2zm3 .5h9v1H5z"/></svg>,
  Indent: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M2 2h12v1H2zm0 3h7v1H2zm3.5 3L9 10.5 5.5 13zm-3.5 0h3v1H2zm0 3h7v1H2z"/></svg>,
  Outdent: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M2 2h12v1H2zm5 3h7v1H7zm-5 3l3.5 2.5L2 13zm5 0h7v1H7zm0 3h7v1H7z"/></svg>,
  Undo: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M5.5 7H9a3.5 3.5 0 0 1 0 7H5v-1.5h4a2 2 0 0 0 0-4H5.5l1.75-1.75-1.06-1.06L2.44 9.44 6.19 13.2l1.06-1.06z"/></svg>,
  Redo: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M10.5 7H7a3.5 3.5 0 0 0 0 7h4v-1.5H7a2 2 0 0 1 0-4h3.5l-1.75-1.75 1.06-1.06 3.75 3.75-3.75 3.75-1.06-1.06z"/></svg>,
  Image: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 2h14v12H1zm1 1v10h12V3zm2 7.5 2.5-3 2 2.5 1.5-1.5 2 2.5zm4.5-5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>,
  Table: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1 2h14v12H1zm1 4h4V3H2zm5 0h3V3H7zm4 0h2V3h-2zM2 7h4v2H2zm5 0h3v2H7zm4 0h2v2h-2zM2 10h4v3H2zm5 0h3v3H7zm4 0h2v3h-2z"/></svg>,
  Link: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M7.5 10.5l-.7.7a2.5 2.5 0 0 1-3.5-3.5l2-2a2.5 2.5 0 0 1 3.7.3l-1.1.7a1 1 0 0 0-1.4-.3l-2 2a1 1 0 0 0 1.5 1.5l.7-.7zM8.5 5.5l.7-.7a2.5 2.5 0 0 1 3.5 3.5l-2 2a2.5 2.5 0 0 1-3.7-.3l1.1-.7a1 1 0 0 0 1.4.3l2-2a1 1 0 0 0-1.5-1.5l-.7.7z"/></svg>,
  PageBreak: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M2 7h12v2H2zM1 4h1v1H1zm1 0h12v1H2zm11 0h1v1h-1zM1 11h1v1H1zm1 0h12v1H2zm11 0h1v1h-1zM4 8l2-2 1 1-1 1zm8 0-2-2-1 1 1 1z"/></svg>,
  Clear: () => <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M10 2 6 6 2 2 1 3l4 4-4 4 1 1 4-4 4 4 1-1-4-4 4-4zm1.5 7h3v1h-3zm0 2h3v1h-3zm0-4h3v1h-3z"/></svg>,
}

// ─── Fonts & sizes ─────────────────────────────────────────────────────────

const FONTS = [
  "Arial", "Times New Roman", "Calibri", "Georgia", "Verdana",
  "Helvetica", "Courier New", "Tahoma", "Trebuchet MS", "Impact",
]

const SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"]

// ─── Main component ───────────────────────────────────────────────────────────

export default function WordEditor({ editorRef, files, onInsertImage, wordCount, pageCount }: WordEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<"home" | "insert" | "view">("home")
  const [font, setFont] = useState("Calibri")
  const [fontSize, setFontSize] = useState("11")
  const [zoom, setZoom] = useState(100)

  // Apply font or font size change while keeping focus
  const applyFont = useCallback((f: string) => {
    setFont(f)
    editorRef.current?.focus()
    document.execCommand("fontName", false, f)
  }, [editorRef])

  const applyFontSize = useCallback((s: string) => {
    setFontSize(s)
    editorRef.current?.focus()
    // execCommand fontSize uses 1–7 scale; use style instead via styleWithCSS
    document.execCommand("styleWithCSS", false, "true")
    document.execCommand("fontSize", false, "7")
    // Override the generated font size with exact px
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
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0">'
    for (let r = 0; r < rows; r++) {
      html += "<tr>"
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #bbb;padding:5px 8px;min-width:40px">&nbsp;</td>'
      }
      html += "</tr>"
    }
    html += "</table><p><br></p>"
    document.execCommand("insertHTML", false, html)
  }, [editorRef])

  // Initialize default content
  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML.trim()) return
    editorRef.current.innerHTML = `<p style="font-family:Calibri;font-size:11pt;margin:0 0 8px"><span style="font-size:24pt;font-family:Calibri Light;color:#2e74b5">Document Title</span></p><p style="font-family:Calibri;font-size:11pt;margin:0 0 8px"><br></p><p style="font-family:Calibri;font-size:11pt;margin:0 0 8px">Start typing your document here...</p>`
  }, [editorRef])

  // ─── Ribbon tab content ─────────────────────────────────────────────────

  const HomeTab = () => (
    <div className="flex items-center gap-0.5 flex-wrap py-1 px-2">
      {/* Clipboard */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-[#d0d0d0]">
        <RibbonBtn title="Undo" onClick={() => exec("undo")}>
          <Icons.Undo />
        </RibbonBtn>
        <RibbonBtn title="Redo" onClick={() => exec("redo")}>
          <Icons.Redo />
        </RibbonBtn>
      </div>

      {/* Font family + size */}
      <div className="flex items-center gap-1 px-2 border-r border-[#d0d0d0]">
        <RibbonSelect
          title="Font"
          value={font}
          onChange={applyFont}
          width="w-32"
          options={FONTS.map((f) => ({ label: f, value: f }))}
        />
        <RibbonSelect
          title="Font Size"
          value={fontSize}
          onChange={applyFontSize}
          width="w-14"
          options={SIZES.map((s) => ({ label: s, value: s }))}
        />
      </div>

      {/* Style buttons */}
      <div className="flex items-center gap-0.5 px-2 border-r border-[#d0d0d0]">
        <RibbonBtn title="Bold (Ctrl+B)" onClick={() => exec("bold")}>
          <Icons.Bold />
        </RibbonBtn>
        <RibbonBtn title="Italic (Ctrl+I)" onClick={() => exec("italic")}>
          <Icons.Italic />
        </RibbonBtn>
        <RibbonBtn title="Underline (Ctrl+U)" onClick={() => exec("underline")}>
          <Icons.Underline />
        </RibbonBtn>
        <RibbonBtn title="Strikethrough" onClick={() => exec("strikeThrough")}>
          <Icons.Strikethrough />
        </RibbonBtn>
        <Divider />
        <ColorPicker label="Text Color" command="foreColor" />
        <ColorPicker label="Highlight Color" command="hiliteColor" />
      </div>

      {/* Paragraph */}
      <div className="flex items-center gap-0.5 px-2 border-r border-[#d0d0d0]">
        <RibbonBtn title="Bullet List" onClick={() => exec("insertUnorderedList")}>
          <Icons.ListUL />
        </RibbonBtn>
        <RibbonBtn title="Numbered List" onClick={() => exec("insertOrderedList")}>
          <Icons.ListOL />
        </RibbonBtn>
        <Divider />
        <RibbonBtn title="Decrease Indent" onClick={() => exec("outdent")}>
          <Icons.Outdent />
        </RibbonBtn>
        <RibbonBtn title="Increase Indent" onClick={() => exec("indent")}>
          <Icons.Indent />
        </RibbonBtn>
        <Divider />
        <RibbonBtn title="Align Left" onClick={() => exec("justifyLeft")}>
          <Icons.AlignLeft />
        </RibbonBtn>
        <RibbonBtn title="Align Center" onClick={() => exec("justifyCenter")}>
          <Icons.AlignCenter />
        </RibbonBtn>
        <RibbonBtn title="Align Right" onClick={() => exec("justifyRight")}>
          <Icons.AlignRight />
        </RibbonBtn>
        <RibbonBtn title="Justify" onClick={() => exec("justifyFull")}>
          <Icons.AlignJustify />
        </RibbonBtn>
      </div>

      {/* Styles */}
      <div className="flex items-center gap-0.5 px-2 border-r border-[#d0d0d0]">
        {[
          { label: "Title", tag: "H1", style: "font-size:24pt;font-family:'Calibri Light';color:#2e74b5" },
          { label: "Heading 1", tag: "H2", style: "font-size:16pt;font-family:'Calibri Light';color:#2e74b5" },
          { label: "Heading 2", tag: "H3", style: "font-size:13pt;font-family:'Calibri Light';color:#2e74b5" },
          { label: "Normal", tag: "P", style: "font-size:11pt;font-family:Calibri;color:#000" },
        ].map(({ label, tag }) => (
          <RibbonBtn key={tag} title={label} wide onClick={() => exec("formatBlock", tag)}>
            {label}
          </RibbonBtn>
        ))}
      </div>

      {/* Clear */}
      <div className="flex items-center gap-0.5 px-2">
        <RibbonBtn title="Clear Formatting" onClick={() => exec("removeFormat")} danger>
          <Icons.Clear />
        </RibbonBtn>
      </div>
    </div>
  )

  const InsertTab = () => (
    <div className="flex items-center gap-0.5 flex-wrap py-1 px-2">
      {/* Image */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-[#d0d0d0]">
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
        <RibbonBtn title="Insert Picture from computer" wide onClick={() => imageInputRef.current?.click()}>
          <span className="flex items-center gap-1"><Icons.Image /><span>Picture</span></span>
        </RibbonBtn>
        {files.length > 0 && (
          <select
            title="Insert uploaded attachment"
            onChange={async (e) => {
              const idx = Number(e.target.value)
              if (isNaN(idx)) return
              onInsertImage(files[idx])
              e.target.value = ""
            }}
            className="h-7 border border-[#ccc] bg-white text-[11px] rounded px-1.5 outline-none focus:border-[#1d5fa6] hover:border-[#a0a0a0] w-36"
          >
            <option value="">Insert Attachment...</option>
            {files.map((f, i) => (
              <option key={i} value={i}>{f.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table picker */}
      <div className="flex items-center gap-0.5 px-2 border-r border-[#d0d0d0]">
        <TablePicker onInsert={insertTable} />
      </div>

      {/* Link */}
      <div className="flex items-center gap-0.5 px-2 border-r border-[#d0d0d0]">
        <RibbonBtn title="Insert Hyperlink" wide onClick={() => {
          const url = window.prompt("Enter URL:", "https://")
          if (url) exec("createLink", url)
        }}>
          <span className="flex items-center gap-1"><Icons.Link /><span>Link</span></span>
        </RibbonBtn>
      </div>

      {/* Page break */}
      <div className="flex items-center gap-0.5 px-2">
        <RibbonBtn title="Insert Page Break" wide onClick={() => exec("insertHorizontalRule")}>
          <span className="flex items-center gap-1"><Icons.PageBreak /><span>Page Break</span></span>
        </RibbonBtn>
      </div>
    </div>
  )

  const ViewTab = () => (
    <div className="flex items-center gap-4 py-1 px-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#444]">Zoom:</span>
        <input
          type="range"
          min={50}
          max={200}
          step={10}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-24 h-1.5 accent-[#1d5fa6]"
        />
        <span className="text-[11px] text-[#444] w-10">{zoom}%</span>
      </div>
    </div>
  )

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-[#c8c8c8] shadow-lg bg-[#f3f3f3]">
      {/* Title bar */}
      <div className="bg-[#2b579a] px-4 py-2 flex items-center justify-between select-none">
        <span className="text-white text-[12px] font-semibold tracking-wide">PDF Maker — Document Editor</span>
        <div className="flex items-center gap-3 text-blue-200 text-[11px]">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>~{pageCount} page{pageCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Ribbon tabs */}
      <div className="bg-[#f3f3f3] border-b border-[#c8c8c8] flex items-end gap-0 px-2 pt-1 select-none">
        {(["home", "insert", "view"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setActiveTab(tab) }}
            className={[
              "px-4 py-1.5 text-[11px] font-medium capitalize transition-all rounded-t",
              activeTab === tab
                ? "bg-white border border-b-white border-[#c8c8c8] text-[#1f1f1f] -mb-px"
                : "text-[#444] hover:bg-[#e5e5e5]",
            ].join(" ")}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Ribbon content */}
      <div className="bg-white border-b border-[#c8c8c8] min-h-[44px] select-none">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "insert" && <InsertTab />}
        {activeTab === "view" && <ViewTab />}
      </div>

      {/* Ruler */}
      <div className="bg-[#f3f3f3] border-b border-[#d0d0d0] h-6 flex items-end px-4 overflow-hidden select-none">
        <div className="flex items-end" style={{ marginLeft: "64px" }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex flex-col items-start" style={{ width: "20px" }}>
              {i % 5 === 0 && (
                <span className="text-[8px] text-[#888] leading-none mb-0.5">{i / 5}</span>
              )}
              <div
                className="bg-[#a0a0a0]"
                style={{ height: i % 5 === 0 ? "8px" : i % 5 === 2 ? "5px" : "3px", width: "1px" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Paper canvas */}
      <div className="flex-1 overflow-auto bg-[#e8e8e8] py-8 flex flex-col items-center gap-6 min-h-[600px]">
        <div
          className="bg-white shadow-xl"
          style={{
            width: `${595 * (zoom / 100)}px`,
            minHeight: `${842 * (zoom / 100)}px`,
            padding: `${72 * (zoom / 100)}px ${80 * (zoom / 100)}px`,
            transform: "none",
            transformOrigin: "top center",
          }}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none w-full h-full text-[#1f1f1f]"
            style={{
              fontFamily: "Calibri, Arial, sans-serif",
              fontSize: "11pt",
              lineHeight: "1.5",
              minHeight: `${698 * (zoom / 100)}px`,
              zoom: `${zoom}%`,
            }}
            onPaste={(e) => {
              // Paste as plain text to avoid cross-origin HTML garbage
              const text = e.clipboardData.getData("text/plain")
              if (text) {
                e.preventDefault()
                document.execCommand("insertText", false, text)
              }
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[#2b579a] px-4 py-1 flex items-center justify-between text-[11px] text-blue-100 select-none">
        <div className="flex items-center gap-4">
          <span>Page 1 of ~{pageCount}</span>
          <span>{wordCount} Words</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onMouseDown={() => setZoom(Math.max(50, zoom - 10))}
            className="hover:bg-blue-700 rounded px-1.5 py-0.5"
          >−</button>
          <span className="w-12 text-center">{zoom}%</span>
          <button
            type="button"
            onMouseDown={() => setZoom(Math.min(200, zoom + 10))}
            className="hover:bg-blue-700 rounded px-1.5 py-0.5"
          >+</button>
        </div>
      </div>
    </div>
  )
}

// ─── Table size picker ────────────────────────────────────────────────────────

function TablePicker({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [open, setOpen] = useState(false)
  const MAX_R = 8
  const MAX_C = 8

  return (
    <div className="relative">
      <RibbonBtn title="Insert Table" wide onClick={() => setOpen((o) => !o)}>
        <span className="flex items-center gap-1"><Icons.Table /><span>Table</span></span>
      </RibbonBtn>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border border-[#ccc] shadow-xl rounded p-3 z-50"
          onMouseLeave={() => setHover(null)}
        >
          <p className="text-[11px] text-[#444] mb-2 text-center">
            {hover ? `${hover[0]}×${hover[1]} Table` : "Select table size"}
          </p>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${MAX_C}, 22px)` }}>
            {Array.from({ length: MAX_R }, (_, r) =>
              Array.from({ length: MAX_C }, (_, c) => (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setHover([r + 1, c + 1])}
                  onClick={() => {
                    if (hover) {
                      onInsert(hover[0], hover[1])
                      setOpen(false)
                    }
                  }}
                  className={[
                    "w-5 h-5 border rounded-sm cursor-pointer transition-colors",
                    hover && r < hover[0] && c < hover[1]
                      ? "bg-[#c9d8f0] border-[#1d5fa6]"
                      : "border-[#ccc] hover:border-[#1d5fa6]",
                  ].join(" ")}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
