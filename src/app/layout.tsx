import type { Metadata } from "next"

import TopNav from "@/components/layout/TopNav"
import Footer from "@/components/layout/Footer"
import { LanguageProvider } from "@/lib/i18n"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gauss PDF - Every tool you need to work with PDFs in one place",
  description: "A 100% client-side local browser workspace to merge, split, compress, edit, convert, OCR, stamp, and protect PDF documents.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050605] text-zinc-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300 flex flex-col justify-between">
        <LanguageProvider>
          <div>
            <TopNav />
            {children}
          </div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}

