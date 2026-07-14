import type { Metadata } from "next"

import TopNav from "@/components/layout/TopNav"
import { LanguageProvider } from "@/lib/i18n"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gauss - All-in-One File Utilities",
  description: "A private browser workspace for preparing, validating, and reporting file utility workflows.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070807] text-white antialiased">
        <LanguageProvider>
          <TopNav />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
