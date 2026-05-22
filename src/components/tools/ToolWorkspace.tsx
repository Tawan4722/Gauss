'use client'

import { useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"

import { useLanguage } from "@/lib/i18n"
import { processTool, type ToolOutput } from "@/lib/tools/processors"
import {
  getDefaultSettings,
  getToolById,
  type ToolSetting,
  type ToolSettingValue,
  type ToolSettings,
} from "@/lib/tools/registry"

const bytesToSize = (bytes: number) => {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const fileMatches = (file: File, acceptedTypes: string[]) => {
  if (acceptedTypes.includes("*/*")) return true

  return acceptedTypes.some((type) => {
    if (type.endsWith("/*")) return file.type.startsWith(type.replace("/*", "/"))
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type.toLowerCase())
    return file.type === type
  })
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function SettingControl({
  toolId,
  setting,
  value,
  onChange,
}: {
  toolId: string
  setting: ToolSetting
  value: ToolSettingValue
  onChange: (value: ToolSettingValue) => void
}) {
  const { settingText, optionText } = useLanguage()
  const id = `setting-${setting.name}`
  const label = settingText(toolId, setting.name, setting.label)

  if (setting.type === "checkbox") {
    return (
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
        <span>{label}</span>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-cyan-300"
        />
      </label>
    )
  }

  if (setting.type === "select") {
    return (
      <label className="grid gap-2 text-sm text-white/70" htmlFor={id}>
        {label}
        <select
          id={id}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
        >
          {setting.options?.map((option) => (
            <option key={option} value={option}>
              {optionText(option)}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (setting.type === "slider") {
    return (
      <label className="grid gap-3 text-sm text-white/70" htmlFor={id}>
        <span className="flex items-center justify-between gap-3">
          {label}
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white">{String(value)}</span>
        </span>
        <input
          id={id}
          type="range"
          min={setting.min}
          max={setting.max}
          step={setting.step ?? 1}
          value={Number(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          className="accent-cyan-300"
        />
      </label>
    )
  }

  return (
    <label className="grid gap-2 text-sm text-white/70" htmlFor={id}>
      {label}
      <input
        id={id}
        type="text"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60"
      />
    </label>
  )
}

export default function ToolWorkspace({ toolId }: { toolId: string }) {
  const tool = getToolById(toolId)
  const { t, toolText } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [settings, setSettings] = useState<ToolSettings>(() => (tool ? getDefaultSettings(tool) : {}))
  const [outputs, setOutputs] = useState<ToolOutput[]>([])
  const [summary, setSummary] = useState("")
  const [notice, setNotice] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const acceptedLabel = useMemo(() => tool?.acceptedFileTypes.join(", ") ?? "", [tool])

  if (!tool) {
    return null
  }

  const addFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles)
    const validFiles = nextFiles.filter((file) => fileMatches(file, tool.acceptedFileTypes))
    const rejectedCount = nextFiles.length - validFiles.length

    setFiles((currentFiles) => {
      const existingKeys = new Set(currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      const uniqueFiles = validFiles.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`))
      return [...currentFiles, ...uniqueFiles]
    })

    setOutputs([])
    setSummary("")
      setNotice(rejectedCount > 0 ? `${rejectedCount} file${rejectedCount === 1 ? "" : "s"} did not match ${acceptedLabel}.` : "")
  }

  const removeFile = (index: number) => {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index))
    setOutputs([])
    setSummary("")
  }

  const processFiles = async () => {
    if (files.length === 0) {
      setNotice(t("workspace.addFiles"))
      return
    }

    setIsProcessing(true)
    setNotice("")

    try {
      const result = await processTool(tool, files, settings)
      setOutputs(result.outputs)
      setSummary(result.summary)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("workspace.failed"))
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadAll = async () => {
    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].name)
      return
    }

    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    outputs.forEach((output) => zip.file(output.name, output.blob))
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } })
    downloadBlob(blob, `${tool.id}-outputs.zip`)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070807] px-5 pb-16 pt-32 text-white sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_90%_15%,rgba(245,158,11,0.13),transparent_30%),linear-gradient(135deg,#070807_0%,#11140f_50%,#060706_100%)]" />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.25fr)_380px]">
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">{toolText(tool.id, "category") || tool.category}</p>
            <h1 className="max-w-3xl text-5xl font-black tracking-[-0.05em] text-white sm:text-7xl">{toolText(tool.id, "name") || tool.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">{toolText(tool.id, "description") || tool.description}</p>
          </motion.div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              addFiles(event.dataTransfer.files)
            }}
            className={`mt-10 flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-[2.25rem] border p-8 text-center shadow-2xl backdrop-blur-2xl transition ${
              isDragging ? "border-cyan-200 bg-cyan-200/10" : "border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={tool.acceptedFileTypes.join(",")}
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files)
                event.target.value = ""
              }}
              className="hidden"
            />
            <div className="grid h-24 w-24 place-items-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-200/20 to-amber-200/10 text-4xl shadow-inner">
              +
            </div>
            <h2 className="mt-8 text-2xl font-bold tracking-[-0.03em]">{t("workspace.dropTitle")}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/45">{t("workspace.accepted")}: {acceptedLabel}. {t("workspace.local")}</p>
          </div>

          {notice ? <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{notice}</p> : null}

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("workspace.selected")}</h2>
              <button
                type="button"
                onClick={() => {
                  setFiles([])
                  setOutputs([])
                  setSummary("")
                }}
                disabled={files.length === 0}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("workspace.clear")}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {files.length === 0 ? (
                <p className="rounded-2xl bg-white/[0.03] px-4 py-5 text-sm text-white/45">{t("workspace.noFiles")}</p>
              ) : (
                files.map((file, index) => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{file.name}</p>
                      <p className="mt-1 text-xs text-white/42">{bytesToSize(file.size)} | {file.type || "Unknown type"}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="rounded-full px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/10 hover:text-white">
                      {t("workspace.remove")}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-2xl lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-lg font-semibold">{t("workspace.settings")}</h2>
          <div className="mt-5 grid gap-5">
            {tool.settingsSchema.map((setting) => (
              <SettingControl
                key={setting.name}
                toolId={tool.id}
                setting={setting}
                value={settings[setting.name]}
                onChange={(value) => {
                  setSettings((currentSettings) => ({ ...currentSettings, [setting.name]: value }))
                  setOutputs([])
                  setSummary("")
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={processFiles}
            disabled={isProcessing || files.length === 0}
            className="mt-7 w-full rounded-2xl bg-cyan-200 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isProcessing ? t("workspace.processing") : t("workspace.process")}
          </button>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-4">
            <h3 className="text-sm font-semibold text-white/85">{t("workspace.outputs")}</h3>
            {summary ? <p className="mt-3 text-sm leading-6 text-white/60">{summary}</p> : <p className="mt-3 text-sm leading-6 text-white/38">{t("workspace.outputHint")}</p>}
            {outputs.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {outputs.map((output) => (
                  <div key={output.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="truncate text-sm font-medium text-white">{output.name}</p>
                    <p className="mt-1 text-xs text-white/42">{bytesToSize(output.size)} | {output.type}</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">{output.message}</p>
                    <button type="button" onClick={() => downloadBlob(output.blob, output.name)} className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-cyan-200/60 hover:text-white">
                      {t("workspace.download")}
                    </button>
                  </div>
                ))}
                <button type="button" onClick={downloadAll} className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-cyan-200">
                  {t("workspace.downloadAll")}
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  )
}
