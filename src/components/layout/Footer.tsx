'use client'

import Link from "next/link"
import { ShieldCheck, Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

export default function Footer() {
  const { toggleLanguage, language } = useLanguage()

  return (
    <footer className="border-t border-border bg-card text-muted-foreground text-xs py-12 px-4 sm:px-6 lg:px-8 mt-24 transition-colors duration-200">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-border">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">
                G
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-foreground">
                Gauss <span className="text-primary">PDF</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Professional local-first document studio for merging, splitting, compressing, converting, and protecting files entirely inside your browser memory.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero Server Transit</span>
            </div>
          </div>

          {/* Quick PDF Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Popular Tools
            </h4>
            <ul className="space-y-2">
              <li><Link href="/tools/merge-pdf" className="hover:text-primary transition-colors">Merge PDF</Link></li>
              <li><Link href="/tools/split-pdf" className="hover:text-primary transition-colors">Split PDF</Link></li>
              <li><Link href="/tools/compress-pdf" className="hover:text-primary transition-colors">Compress PDF</Link></li>
              <li><Link href="/tools/word-to-pdf" className="hover:text-primary transition-colors">Word to PDF</Link></li>
              <li><Link href="/tools/pdf-to-word" className="hover:text-primary transition-colors">PDF to Word</Link></li>
              <li><Link href="/tools/pdf-to-jpg" className="hover:text-primary transition-colors">PDF to JPG</Link></li>
            </ul>
          </div>

          {/* Security & Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Security & Privacy
            </h4>
            <ul className="space-y-2">
              <li><Link href="/tools/protect-pdf" className="hover:text-primary transition-colors">Protect PDF with Password</Link></li>
              <li><Link href="/tools/unlock-pdf" className="hover:text-primary transition-colors">Unlock Password PDF</Link></li>
              <li><Link href="/tools/watermark-pdf" className="hover:text-primary transition-colors">Add Watermark</Link></li>
              <li><Link href="/tools/redact-pdf" className="hover:text-primary transition-colors">Redact Sensitive Text</Link></li>
              <li><Link href="/tools/ocr-pdf" className="hover:text-primary transition-colors">Local OCR Reader</Link></li>
              <li><Link href="/tools/sign-pdf" className="hover:text-primary transition-colors">Electronic Signature</Link></li>
            </ul>
          </div>

          {/* Productivity Suite */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Workspace Suite
            </h4>
            <ul className="space-y-2">
              <li><Link href="/tools/editor" className="hover:text-primary transition-colors">Document Editor</Link></li>
              <li><Link href="/tools/organize-pdf" className="hover:text-primary transition-colors">Organize Pages</Link></li>
              <li><Link href="/tools/rotate-pdf" className="hover:text-primary transition-colors">Rotate PDF Pages</Link></li>
              <li><Link href="/tools/crop-pdf" className="hover:text-primary transition-colors">Crop PDF Margins</Link></li>
              <li><Link href="/settings" className="hover:text-primary transition-colors">Local Settings</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© 2026 Gauss Document Studio. Built with client-side Web Workers & pdf-lib.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 hover:text-primary transition"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === "en" ? "English" : "ภาษาไทย"}</span>
            </button>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1">
              Local Memory Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
