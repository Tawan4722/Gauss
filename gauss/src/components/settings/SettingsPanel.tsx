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
    <main className="min-h-screen bg-[#070807] px-5 pb-16 pt-32 text-white sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.13),transparent_32%),linear-gradient(135deg,#070807,#11140f)]" />
      <section className="relative z-10 mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">{t("settings.badge")}</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl">{t("settings.title")}</h1>
        <p className="mt-5 text-white/55">{t("settings.description")}</p>

        <div className="mt-10 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-2xl">
          <label className="flex items-center justify-between gap-5 rounded-3xl bg-white/[0.04] px-5 py-4">
            <span>
              <span className="block font-semibold">{t("settings.reduceMotion")}</span>
              <span className="mt-1 block text-sm text-white/45">{t("settings.reduceMotionHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => updatePreference("reduceMotion", event.target.checked)} className="h-5 w-5 accent-cyan-300" />
          </label>

          <label className="flex items-center justify-between gap-5 rounded-3xl bg-white/[0.04] px-5 py-4">
            <span>
              <span className="block font-semibold">{t("settings.rememberLastTool")}</span>
              <span className="mt-1 block text-sm text-white/45">{t("settings.rememberLastToolHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.rememberLastTool} onChange={(event) => updatePreference("rememberLastTool", event.target.checked)} className="h-5 w-5 accent-cyan-300" />
          </label>

          <label className="flex items-center justify-between gap-5 rounded-3xl bg-white/[0.04] px-5 py-4">
            <span>
              <span className="block font-semibold">{t("settings.privateMode")}</span>
              <span className="mt-1 block text-sm text-white/45">{t("settings.privateModeHelp")}</span>
            </span>
            <input type="checkbox" checked={preferences.privateMode} onChange={(event) => updatePreference("privateMode", event.target.checked)} className="h-5 w-5 accent-cyan-300" />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-sm text-white/45" role="status">{status || t("settings.status")}</p>
            <button type="button" onClick={resetPreferences} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white">
              {t("settings.reset")}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

