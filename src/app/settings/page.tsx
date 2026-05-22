import type { Metadata } from "next"

import SettingsPanel from "@/components/settings/SettingsPanel"

export const metadata: Metadata = {
  title: "Settings | Gauss",
  description: "Local workspace settings for Gauss file utilities.",
}

export default function SettingsPage() {
  return <SettingsPanel />
}
