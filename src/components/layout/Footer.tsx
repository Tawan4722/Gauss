'use client'

import Link from "next/link"
import { ShieldCheck, Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

export default function Footer() {
  const { toggleLanguage, language } = useLanguage()

  return (
    <footer className="border-t border-[#202220] bg-[#050605] text-zinc-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#202220]">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400 text-[#050605] font-black text-xs">
                G
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-white">
                Gauss <span className="text-cyan-400">PDF</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Professional local-first document studio for merging, splitting, compressing, converting, and protecting files entirely inside your browser memory.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-3 py-1 text-[10px] font-bold text-cyan-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero Server Transit</span>
            </div>
          </div>

          {/* Quick PDF Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Popular Tools
            </h4>
            <ul className="space-y-2">
              <li><Link href="/tools/merge-pdf" className="hover:text-cyan-300 transition-colors">Merge PDF</Link></li>
              <li><Link href="/tools/split-pdf" className="hover:text-cyan-300 transition-colors">Split PDF</Link></li>
              <li><Link href="/tools/compress-pdf" className="hover:text-cyan-300 transition-colors">Compress PDF</Link></li>
              <li><Link href="/tools/word-to-pdf" className="hover:text-cyan-300 transition-colors">Word to PDF</Link></li>
              <li><Link href="/tools/pdf-to-word" className="hover:text-cyan-300 transition-colors">PDF to Word</Link></li>
              <li><Link href="/tools/pdf-to-jpg" className="hover:text-cyan-300 transition-colors">PDF to JPG</Link></li>
            </ul>
          </div>

          {/* Security & Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Security & Privacy
            </h4>
            <ul className="space-y-2">
              <li><Link href="/tools/protect-pdf" className="hover:text-cyan-300 transition-colors">Protect PDF with Password</Link></li>
              <li><Link href="/tools/unlock-pdf" className="hover:text-cyan-300 transition-colors">Unlock Password PDF</Link></li>
              <li><Link href="/tools/watermark-pdf" className="hover:text-cyan-300 transition-colors">Add Watermark</Link></li>
              <li><Link href="/tools/redact-pdf" className="hover:text-cyan-300 transition-colors">Redact Sensitive Text</Link></li>
              <li><Link href="/tools/ocr-pdf" className="hover:text-cyan-300 transition-colors">Local OCR Reader</Link></li>
              <li><Link href="/tools/sign-pdf" className="hover:text-cyan-300 transition-colors">Electronic Signature</Link></li>
            </ul>
          </div>

          {/* Productivity Suite */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Workspace Suite
            </h4>
            <ul className="space-y-2">
              <li><Link href="/tools/editor" className="hover:text-cyan-300 transition-colors">Document Editor</Link></li>
              <li><Link href="/tools/organize-pdf" className="hover:text-cyan-300 transition-colors">Organize Pages</Link></li>
              <li><Link href="/tools/rotate-pdf" className="hover:text-cyan-300 transition-colors">Rotate PDF Pages</Link></li>
              <li><Link href="/tools/crop-pdf" className="hover:text-cyan-300 transition-colors">Crop PDF Margins</Link></li>
              <li><Link href="/settings" className="hover:text-cyan-300 transition-colors">Local Settings</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© 2026 Gauss Document Studio. Built with client-side Web Workers & pdf-lib.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === "en" ? "English" : "ภาษาไทย"}</span>
            </button>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1">
              Local Memory Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
