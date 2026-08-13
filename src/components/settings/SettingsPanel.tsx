'use client'

import { useEffect, useState } from "react"

import { useLanguage } from "@/lib/i18n"

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
    setStatus(t("settings.resetStatus"))
  }

  return (
    <main className="min-h-screen bg-[#050605] px-6 pb-16 pt-24 text-zinc-100">
      <section className="relative z-10 mx-auto max-w-3xl animate-fade-in">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-white">{t("settings.title")}</h1>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            System Config
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">{t("settings.description")}</p>

        <div className="mt-6 border border-[#202220] bg-[#0d0e0d] p-6 rounded-xl space-y-5">
          <label className="flex items-center justify-between gap-5 border-b border-[#202220] pb-4">
            <span>
              <span className="block text-xs font-semibold text-zinc-200">{t("settings.reduceMotion")}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-400">{t("settings.reduceMotionHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => updatePreference("reduceMotion", event.target.checked)} className="h-4 w-4 rounded accent-cyan-400 border-[#202220]" />
          </label>

          <label className="flex items-center justify-between gap-5 border-b border-[#202220] pb-4">
            <span>
              <span className="block text-xs font-semibold text-zinc-200">{t("settings.rememberLastTool")}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-400">{t("settings.rememberLastToolHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.rememberLastTool} onChange={(event) => updatePreference("rememberLastTool", event.target.checked)} className="h-4 w-4 rounded accent-cyan-400 border-[#202220]" />
          </label>

          <label className="flex items-center justify-between gap-5 pb-2">
            <span>
              <span className="block text-xs font-semibold text-zinc-200">{t("settings.privateMode")}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-400">{t("settings.privateModeHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.privateMode} onChange={(event) => updatePreference("privateMode", event.target.checked)} className="h-4 w-4 rounded accent-cyan-400 border-[#202220]" />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#202220]">
            <p className="text-[10px] font-medium text-cyan-400/80 font-mono" role="status">{status || t("settings.status")}</p>
            <button type="button" onClick={resetPreferences} className="rounded-lg border border-[#202220] bg-[#181918] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-amber-500/40 hover:bg-amber-950/20 hover:text-amber-400">
              {t("settings.reset")}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

