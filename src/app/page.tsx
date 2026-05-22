'use client'

import Link from "next/link"
import { motion } from "framer-motion"

import { useLanguage } from "@/lib/i18n"
import { toolRegistry } from "@/lib/tools/registry"

export default function Home() {
  const { t, toolText } = useLanguage()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070807] px-5 pb-16 pt-32 text-white sm:px-8">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_86%_24%,rgba(245,158,11,0.16),transparent_30%),linear-gradient(145deg,#070807_0%,#11150f_52%,#050605_100%)]" />
      <div className="absolute inset-0 z-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_520px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100/70 shadow-lg backdrop-blur">
            {t("home.badge")}
          </span>
          <h1 className="mt-8 max-w-4xl text-7xl font-black tracking-[-0.075em] sm:text-8xl lg:text-[9.5rem]">
            Gauss
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/56 sm:text-xl">
            {t("home.description")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/tools/converter" className="rounded-full bg-cyan-200 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-white">
              {t("home.start")}
            </Link>
            <Link href="/tools" className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/72 transition hover:border-white/25 hover:text-white">
              {t("home.viewTools")}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-2xl"
        >
          <Link
            href="/tools/converter"
            className="group flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-black/20 p-10 text-center transition hover:border-cyan-200/55 hover:bg-cyan-200/10"
          >
            <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-cyan-200/25 to-amber-200/15 text-4xl font-light shadow-inner transition group-hover:scale-105">
              +
            </div>
            <span className="mt-8 text-xl font-bold tracking-[-0.03em]">{t("home.uploadTitle")}</span>
            <span className="mt-2 max-w-xs text-sm leading-6 text-white/42">{t("home.uploadDescription")}</span>
          </Link>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {toolRegistry.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 transition hover:border-white/25 hover:bg-white/[0.07]">
                <span className="block text-sm font-semibold">{toolText(tool.id, "category") || tool.category}</span>
                <span className="mt-1 block truncate text-xs text-white/38">{toolText(tool.id, "name") || tool.name}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  )
}
