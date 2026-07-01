'use client'

import { useState, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, Move, Settings, Type, PenTool, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

interface LayoutSandboxProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: SandboxConfig) => void
  initialConfig?: SandboxConfig
  pageCount?: number
}

export interface SandboxConfig {
  watermarkText: string
  watermarkX: number
  watermarkY: number
  watermarkSize: number
  watermarkOpacity: number
  signatureText: string
  signatureX: number
  signatureY: number
  signatureScale: number
  batesX: number
  batesY: number
  batesFontSize: number
  showBates: boolean
  showWatermark: boolean
  showSignature: boolean
}

const defaultSandboxConfig: SandboxConfig = {
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
  showBates: true,
  showWatermark: true,
  showSignature: false,
}

export default function LayoutSandbox({
  isOpen,
  onClose,
  onSave,
  initialConfig = defaultSandboxConfig,
  pageCount = 1,
}: LayoutSandboxProps) {
  const [config, setConfig] = useState<SandboxConfig>(initialConfig)
  const [zoom, setZoom] = useState<number>(0.85) // Zoom multiplier (e.g. 0.85x)
  const [activeDragItem, setActiveDragItem] = useState<"watermark" | "signature" | "bates" | null>(null)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStartOffset = useRef({ x: 0, y: 0 })

  // Standard PDF Canvas dimensions (A4 paper size in points: 595 x 842)
  const pdfWidth = 595
  const pdfHeight = 842

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig)
    }
  }, [isOpen, initialConfig])

  if (!isOpen) return null

  // Pointer event handlers for dragging layout items
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, item: "watermark" | "signature" | "bates") => {
    event.preventDefault()
    setActiveDragItem(item)
    
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    dragStartOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    element.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>, item: "watermark" | "signature" | "bates") => {
    if (activeDragItem !== item || !canvasRef.current) return
    event.preventDefault()

    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    // Calculate raw client coords inside the canvas boundary, relative to zoom
    const rawX = (event.clientX - canvasRect.left - dragStartOffset.current.x) / zoom
    const rawY = (event.clientY - canvasRect.top - dragStartOffset.current.y) / zoom

    // Restrict positions inside PDF boundaries
    const boundX = Math.min(Math.max(0, Math.round(rawX)), pdfWidth - 80)
    const boundY = Math.min(Math.max(0, Math.round(rawY)), pdfHeight - 40)

    // PDF coordinate system starts at bottom-left, browser coordinates at top-left.
    // X = boundX
    // Y = pdfHeight - boundY - itemHeight (we offset approximate height for representation)
    const pdfY = pdfHeight - boundY - 30

    setConfig((prev) => {
      if (item === "watermark") {
        return { ...prev, watermarkX: boundX, watermarkY: pdfY }
      }
      if (item === "signature") {
        return { ...prev, signatureX: boundX, signatureY: pdfY }
      }
      return { ...prev, batesX: boundX, batesY: pdfY }
    })
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>, item: "watermark" | "signature" | "bates") => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setActiveDragItem(null)
  }

  // Convert PDF-coordinates (Y starting from bottom) back to CSS-top-coordinates
  const getCssTop = (pdfY: number) => {
    // top = pdfHeight - pdfY - approximateHeightOffset
    return pdfHeight - pdfY - 30
  }

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-white/10 bg-[#0a0c0a] shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Layout Sandbox Editor</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Preflight Coordinate Workspace</p>
            </div>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1.5 rounded-lg text-white/60 hover:bg-white/[0.05] hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-white/80 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1.5 rounded-lg text-white/60 hover:bg-white/[0.05] hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/[0.05] p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* WORKSPACE BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT AREA: Layout Preview Canvas */}
          <div className="flex-1 overflow-auto bg-[#070807] p-8 flex items-start justify-center relative select-none">
            {/* Visual grid backdrop */}
            <div className="absolute inset-0 z-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:24px_24px]" />
            
            {/* Sheet Canvas representation */}
            <div
              ref={canvasRef}
              className="relative bg-zinc-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none transition-all duration-100"
              style={{
                width: `${pdfWidth * zoom}px`,
                height: `${pdfHeight * zoom}px`,
              }}
            >
              {/* Reference Grid lines */}
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/10 flex items-center justify-center">
                <span className="text-[10px] text-white/5 uppercase tracking-widest">595 x 842 PT (A4)</span>
              </div>

              {/* Page Number Overlay */}
              <div className="absolute top-4 left-4 text-[9px] uppercase tracking-wider text-white/20 font-bold bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-md">
                Preflight Preview (1 of {pageCount})
              </div>

              {/* 1. Bates Stamp Overlay Element */}
              {config.showBates && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, "bates")}
                  onPointerMove={(e) => handlePointerMove(e, "bates")}
                  onPointerUp={(e) => handlePointerUp(e, "bates")}
                  className={cn(
                    "absolute cursor-move select-none rounded border px-3 py-1 font-mono flex items-center gap-1.5 backdrop-blur-sm transition-shadow shadow-md",
                    activeDragItem === "bates" 
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 ring-2 ring-cyan-500/20" 
                      : "border-cyan-500/30 bg-cyan-950/20 text-cyan-300 hover:border-cyan-300"
                  )}
                  style={{
                    left: `${config.batesX * zoom}px`,
                    top: `${getCssTop(config.batesY) * zoom}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left"
                  }}
                >
                  <Hash className="h-3 w-3" />
                  <span style={{ fontSize: `${config.batesFontSize}px` }}>
                    PLAINTIFF-000101
                  </span>
                  <div className="absolute -top-5 left-0 rounded bg-cyan-400 px-1 py-0.5 text-[8px] font-black text-zinc-950 opacity-0 group-hover:opacity-100 transition">
                    X:{config.batesX} Y:{config.batesY}
                  </div>
                </div>
              )}

              {/* 2. Watermark Overlay Element */}
              {config.showWatermark && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, "watermark")}
                  onPointerMove={(e) => handlePointerMove(e, "watermark")}
                  onPointerUp={(e) => handlePointerUp(e, "watermark")}
                  className={cn(
                    "absolute cursor-move select-none rounded border px-4 py-2 flex items-center justify-center font-black tracking-widest text-center whitespace-nowrap",
                    activeDragItem === "watermark" 
                      ? "border-amber-400 bg-amber-950/50 text-amber-200" 
                      : "border-amber-500/20 bg-amber-500/5 text-amber-500/70 hover:border-amber-400/40"
                  )}
                  style={{
                    left: `${config.watermarkX * zoom}px`,
                    top: `${getCssTop(config.watermarkY) * zoom}px`,
                    fontSize: `${config.watermarkSize * zoom}px`,
                    opacity: config.watermarkOpacity,
                    transformOrigin: "top left",
                    transform: "rotate(-30deg)"
                  }}
                >
                  {config.watermarkText || "DRAFT"}
                </div>
              )}

              {/* 3. Signature Overlay Element */}
              {config.showSignature && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, "signature")}
                  onPointerMove={(e) => handlePointerMove(e, "signature")}
                  onPointerUp={(e) => handlePointerUp(e, "signature")}
                  className={cn(
                    "absolute cursor-move select-none rounded border p-3 flex flex-col items-center justify-center font-bold tracking-tight text-center min-w-[140px]",
                    activeDragItem === "signature" 
                      ? "border-green-400 bg-green-950/50 text-green-200" 
                      : "border-green-500/30 bg-green-950/10 text-green-300 hover:border-green-400"
                  )}
                  style={{
                    left: `${config.signatureX * zoom}px`,
                    top: `${getCssTop(config.signatureY) * zoom}px`,
                    transform: `scale(${zoom * config.signatureScale})`,
                    transformOrigin: "top left"
                  }}
                >
                  <PenTool className="h-3.5 w-3.5 mb-1 text-green-400" />
                  <span className="text-[10px] italic border-b border-green-500/20 pb-1 px-2 font-serif text-white/80">
                    {config.signatureText || "Authorized Sign"}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-green-400/60 mt-1">Signature Area</span>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT AREA: Settings Sidebar */}
          <div className="w-[340px] shrink-0 border-l border-white/5 bg-black/25 p-6 overflow-y-auto space-y-6">
            
            {/* Bates stamping setup */}
            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300">
                <input
                  type="checkbox"
                  checked={config.showBates}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showBates: e.target.checked }))}
                  className="rounded border-white/20 bg-zinc-950 text-cyan-400 accent-cyan-300"
                />
                <span>Bates Stamp</span>
              </label>

              {config.showBates && (
                <div className="space-y-3 pt-2 text-xs text-white/70">
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-black/40 p-2 rounded-lg border border-white/5">
                    <div>X: {config.batesX} pt</div>
                    <div>Y: {config.batesY} pt</div>
                  </div>
                  <label className="grid gap-1">
                    <span>Font Size</span>
                    <input
                      type="range"
                      min={6}
                      max={18}
                      value={config.batesFontSize}
                      onChange={(e) => setConfig((prev) => ({ ...prev, batesFontSize: Number(e.target.value) }))}
                      className="accent-cyan-300"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Watermark Setup */}
            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <input
                  type="checkbox"
                  checked={config.showWatermark}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showWatermark: e.target.checked }))}
                  className="rounded border-white/20 bg-zinc-950 text-amber-400 accent-amber-300"
                />
                <span>Watermark Text</span>
              </label>

              {config.showWatermark && (
                <div className="space-y-3 pt-2 text-xs text-white/70">
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-black/40 p-2 rounded-lg border border-white/5">
                    <div>X: {config.watermarkX} pt</div>
                    <div>Y: {config.watermarkY} pt</div>
                  </div>
                  <label className="grid gap-1">
                    <span>Watermark Label</span>
                    <input
                      type="text"
                      value={config.watermarkText}
                      onChange={(e) => setConfig((prev) => ({ ...prev, watermarkText: e.target.value }))}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span>Font Size</span>
                    <input
                      type="range"
                      min={24}
                      max={120}
                      value={config.watermarkSize}
                      onChange={(e) => setConfig((prev) => ({ ...prev, watermarkSize: Number(e.target.value) }))}
                      className="accent-amber-300"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span>Opacity ({Math.round(config.watermarkOpacity * 100)}%)</span>
                    <input
                      type="range"
                      min={0.05}
                      max={0.5}
                      step={0.05}
                      value={config.watermarkOpacity}
                      onChange={(e) => setConfig((prev) => ({ ...prev, watermarkOpacity: Number(e.target.value) }))}
                      className="accent-amber-300"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Signature Setup */}
            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-400">
                <input
                  type="checkbox"
                  checked={config.showSignature}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showSignature: e.target.checked }))}
                  className="rounded border-white/20 bg-zinc-950 text-green-400 accent-green-300"
                />
                <span>Signature Block</span>
              </label>

              {config.showSignature && (
                <div className="space-y-3 pt-2 text-xs text-white/70">
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-black/40 p-2 rounded-lg border border-white/5">
                    <div>X: {config.signatureX} pt</div>
                    <div>Y: {config.signatureY} pt</div>
                  </div>
                  <label className="grid gap-1">
                    <span>Name / Title</span>
                    <input
                      type="text"
                      value={config.signatureText}
                      onChange={(e) => setConfig((prev) => ({ ...prev, signatureText: e.target.value }))}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span>Signature Scale</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={config.signatureScale}
                      onChange={(e) => setConfig((prev) => ({ ...prev, signatureScale: Number(e.target.value) }))}
                      className="accent-green-300"
                    />
                  </label>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-black/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-cyan-200 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-md transition hover:bg-white shadow-[0_4px_20px_rgba(165,243,252,0.2)]"
          >
            Apply Layout
          </button>
        </div>

      </div>
    </div>
  )
}
