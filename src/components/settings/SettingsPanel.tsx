'use client'

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { Sun, Moon } from "lucide-react"

type Preferences = {
  reduceMotion: boolean
  rememberLastTool: boolean
  privateMode: boolean
}

const defaultPreferences: Preferences = {
  reduceMotion: false,
  rememberLastTool: true,
  privateMode: true,
}

const storageKey = "gauss-preferences"

export default function SettingsPanel() {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [status, setStatus] = useState("")

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedPreferences = window.localStorage.getItem(storageKey)

      if (!storedPreferences) return

      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(storedPreferences) })
      } catch {
        setStatus(t("settings.invalid"))
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [t])

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    const nextPreferences = { ...preferences, [key]: value }
    setPreferences(nextPreferences)
    window.localStorage.setItem(storageKey, JSON.stringify(nextPreferences))
    setStatus(t("settings.saved"))
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    window.localStorage.setItem(storageKey, JSON.stringify(defaultPreferences))
    setTheme("light")
    setStatus(t("settings.resetStatus"))
  }

  return (
    <main className="min-h-screen bg-background px-6 pb-16 pt-24 text-foreground transition-colors duration-200">
      <section className="relative z-10 mx-auto max-w-3xl animate-fade-in">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t("settings.title")}</h1>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            System Config
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("settings.description")}</p>

        <div className="mt-6 border border-border bg-card p-6 rounded-xl space-y-5 transition-colors duration-200">
          {/* Appearance Theme Selector */}
          <div className="border-b border-border pb-4">
            <span className="block text-xs font-semibold text-foreground">Appearance Theme (ธีมการแสดงผล)</span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">เลือกโทนสีถนอมสายตาสำหรับใช้งาน (Warm Paper Yellow เป็นค่าเริ่มต้น)</span>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-bold transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Warm Paper Yellow (Light Default)</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-bold transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Moon className="h-4 w-4 text-sky-400" />
                <span>Warm Charcoal (Dark)</span>
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between gap-5 border-b border-border pb-4 cursor-pointer">
            <span>
              <span className="block text-xs font-semibold text-foreground">{t("settings.reduceMotion")}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{t("settings.reduceMotionHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => updatePreference("reduceMotion", event.target.checked)} className="h-4 w-4 rounded accent-primary border-border" />
          </label>

          <label className="flex items-center justify-between gap-5 border-b border-border pb-4 cursor-pointer">
            <span>
              <span className="block text-xs font-semibold text-foreground">{t("settings.rememberLastTool")}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{t("settings.rememberLastToolHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.rememberLastTool} onChange={(event) => updatePreference("rememberLastTool", event.target.checked)} className="h-4 w-4 rounded accent-primary border-border" />
          </label>

          <label className="flex items-center justify-between gap-5 pb-2 cursor-pointer">
            <span>
              <span className="block text-xs font-semibold text-foreground">{t("settings.privateMode")}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{t("settings.privateModeHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.privateMode} onChange={(event) => updatePreference("privateMode", event.target.checked)} className="h-4 w-4 rounded accent-primary border-border" />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
            <p className="text-[10px] font-medium text-primary/80 font-mono" role="status">{status || t("settings.status")}</p>
            <button type="button" onClick={resetPreferences} className="rounded-lg border border-border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400">
              {t("settings.reset")}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

