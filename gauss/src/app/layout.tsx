import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import TopNav from "@/components/layout/TopNav"
import { LanguageProvider } from "@/lib/i18n"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

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
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#070807] text-white antialiased`}>
        <LanguageProvider>
          <TopNav />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
