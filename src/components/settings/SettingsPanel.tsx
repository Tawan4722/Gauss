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
    <main className="min-h-screen bg-black px-6 pb-16 pt-24 text-white">
      <section className="relative z-10 mx-auto max-w-3xl animate-fade-in">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{t("settings.title")}</h1>
        <p className="mt-2 text-xs text-zinc-400">{t("settings.description")}</p>
 
        <div className="mt-6 border border-zinc-900 bg-zinc-950/20 p-5 rounded-2xl space-y-4">
          <label className="flex items-center justify-between gap-5 border-b border-zinc-900 pb-4">
            <span>
              <span className="block text-xs font-semibold text-zinc-200">{t("settings.reduceMotion")}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">{t("settings.reduceMotionHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => updatePreference("reduceMotion", event.target.checked)} className="h-4 w-4 accent-zinc-300" />
          </label>
 
          <label className="flex items-center justify-between gap-5 border-b border-zinc-900 pb-4">
            <span>
              <span className="block text-xs font-semibold text-zinc-200">{t("settings.rememberLastTool")}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">{t("settings.rememberLastToolHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.rememberLastTool} onChange={(event) => updatePreference("rememberLastTool", event.target.checked)} className="h-4 w-4 accent-zinc-300" />
          </label>
 
          <label className="flex items-center justify-between gap-5 pb-2">
            <span>
              <span className="block text-xs font-semibold text-zinc-200">{t("settings.privateMode")}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">{t("settings.privateModeHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.privateMode} onChange={(event) => updatePreference("privateMode", event.target.checked)} className="h-4 w-4 accent-zinc-300" />
          </label>
 
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-900">
            <p className="text-[10px] font-medium text-zinc-500" role="status">{status || t("settings.status")}</p>
            <button type="button" onClick={resetPreferences} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
              {t("settings.reset")}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

