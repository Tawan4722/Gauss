'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Language = "en" | "th"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (key: string) => string
  toolText: (toolId: string, field: "name" | "category" | "description") => string
  settingText: (toolId: string, settingName: string, fallback: string) => string
  optionText: (value: string) => string
}

const storageKey = "gauss-language"

const common: Record<Language, Record<string, string>> = {
  en: {
    "nav.tools": "Tools",
    "nav.settings": "Settings",
    "nav.language": "TH",
    "home.badge": "Professional File Suite",
    "home.description": "A precise, private all-in-one workspace for image, PDF, conversion, archive, batch, OCR, metadata, hash, and text utilities.",
    "home.start": "Start Uploading",
    "home.viewTools": "View Tools",
    "home.uploadTitle": "Upload Files",
    "home.uploadDescription": "Open the converter workspace, drag files in, tune settings, and export real downloadable outputs.",
    "all.badge": "All-in-one mode",
    "all.title": "Use every Gauss tool from one workspace.",
    "all.description": "Choose a tool, upload files, adjust every option, process locally, and download real outputs.",
    "workspace.dropTitle": "Drop files here or click to browse",
    "workspace.accepted": "Accepted input",
    "workspace.local": "Processing runs locally in your browser.",
    "workspace.selected": "Selected files",
    "workspace.noFiles": "No files selected yet.",
    "workspace.clear": "Clear",
    "workspace.remove": "Remove",
    "workspace.settings": "Tool settings",
    "workspace.process": "Process files",
    "workspace.processing": "Processing...",
    "workspace.outputs": "Outputs",
    "workspace.outputHint": "Run processing to generate downloadable files.",
    "workspace.download": "Download",
    "workspace.downloadAll": "Download all",
    "workspace.addFiles": "Add at least one file before processing.",
    "workspace.failed": "Processing failed. Check the selected files and try again.",
    "settings.badge": "Settings",
    "settings.title": "Workspace controls.",
    "settings.description": "These preferences are local to the browser and do not require an account or server.",
    "settings.reduceMotion": "Reduce motion",
    "settings.reduceMotionHelp": "Prefer quieter transitions where supported.",
    "settings.rememberLastTool": "Remember last tool",
    "settings.rememberLastToolHelp": "Keep the most recent workspace ready for a future release.",
    "settings.privateMode": "Private mode",
    "settings.privateModeHelp": "Keep file workflows client-side unless a server pipeline is explicitly added.",
    "settings.saved": "Preferences saved.",
    "settings.resetStatus": "Preferences reset to defaults.",
    "settings.invalid": "Stored preferences were invalid and have been reset.",
    "settings.status": "Preferences are stored locally in this browser.",
    "settings.reset": "Reset",
  },
  th: {
    "nav.tools": "เครื่องมือ",
    "nav.settings": "ตั้งค่า",
    "nav.language": "EN",
    "home.badge": "ชุดเครื่องมือไฟล์ระดับโปร",
    "home.description": "พื้นที่ทำงานรวมทุกอย่างสำหรับไฟล์แบบเป็นส่วนตัว รองรับรูปภาพ PDF แปลงไฟล์ บีบอัดไฟล์ งานชุด OCR เมตาดาตา แฮช และข้อความ",
    "home.start": "เริ่มอัปโหลด",
    "home.viewTools": "ดูเครื่องมือ",
    "home.uploadTitle": "อัปโหลดไฟล์",
    "home.uploadDescription": "เปิดพื้นที่แปลงไฟล์ ลากไฟล์เข้ามา ปรับตัวเลือก แล้วดาวน์โหลดผลลัพธ์จริงได้ทันที",
    "all.badge": "โหมดรวมทุกอย่าง",
    "all.title": "ใช้ทุกเครื่องมือของ Gauss ได้ในหน้าเดียว",
    "all.description": "เลือกเครื่องมือ อัปโหลดไฟล์ ปรับทุกตัวเลือก ประมวลผลในเครื่องของคุณ และดาวน์โหลดผลลัพธ์จริง",
    "workspace.dropTitle": "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์",
    "workspace.accepted": "ไฟล์ที่รองรับ",
    "workspace.local": "ประมวลผลในเบราว์เซอร์ของคุณ",
    "workspace.selected": "ไฟล์ที่เลือก",
    "workspace.noFiles": "ยังไม่ได้เลือกไฟล์",
    "workspace.clear": "ล้าง",
    "workspace.remove": "ลบ",
    "workspace.settings": "ตัวเลือกเครื่องมือ",
    "workspace.process": "ประมวลผลไฟล์",
    "workspace.processing": "กำลังประมวลผล...",
    "workspace.outputs": "ผลลัพธ์",
    "workspace.outputHint": "ประมวลผลเพื่อสร้างไฟล์สำหรับดาวน์โหลด",
    "workspace.download": "ดาวน์โหลด",
    "workspace.downloadAll": "ดาวน์โหลดทั้งหมด",
    "workspace.addFiles": "เพิ่มอย่างน้อยหนึ่งไฟล์ก่อนประมวลผล",
    "workspace.failed": "ประมวลผลไม่สำเร็จ ตรวจสอบไฟล์ที่เลือกแล้วลองใหม่",
    "settings.badge": "ตั้งค่า",
    "settings.title": "ควบคุมพื้นที่ทำงาน",
    "settings.description": "การตั้งค่านี้เก็บไว้เฉพาะในเบราว์เซอร์ ไม่ต้องใช้บัญชีหรือเซิร์ฟเวอร์",
    "settings.reduceMotion": "ลดการเคลื่อนไหว",
    "settings.reduceMotionHelp": "ใช้แอนิเมชันที่นิ่งขึ้นเมื่อรองรับ",
    "settings.rememberLastTool": "จำเครื่องมือล่าสุด",
    "settings.rememberLastToolHelp": "เก็บพื้นที่ทำงานล่าสุดไว้สำหรับเวอร์ชันถัดไป",
    "settings.privateMode": "โหมดส่วนตัว",
    "settings.privateModeHelp": "ให้เวิร์กโฟลว์ไฟล์อยู่ฝั่งเบราว์เซอร์ เว้นแต่จะเพิ่มระบบเซิร์ฟเวอร์โดยชัดเจน",
    "settings.saved": "บันทึกการตั้งค่าแล้ว",
    "settings.resetStatus": "รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นแล้ว",
    "settings.invalid": "ข้อมูลการตั้งค่าเดิมไม่ถูกต้องและถูกรีเซ็ตแล้ว",
    "settings.status": "การตั้งค่าถูกเก็บไว้ในเบราว์เซอร์นี้",
    "settings.reset": "รีเซ็ต",
  },
}

const tools: Record<Language, Record<string, { name: string; category: string; description: string }>> = {
  en: {},
  th: {
    image: { name: "ห้องภาพ", category: "รูปภาพ", description: "แปลง ปรับขนาด หมุน พลิก และใส่เอฟเฟกต์รูปภาพเป็นฟอร์แมตที่เบราว์เซอร์รองรับ" },
    pdf: { name: "โต๊ะ PDF", category: "PDF", description: "ตรวจสอบ รวม แยก ดึงหน้า หรือบันทึก PDF ใหม่ในเบราว์เซอร์" },
    converter: { name: "ตัวแปลงไฟล์", category: "แปลง", description: "แปลงไฟล์ที่รองรับเป็น PDF รูปภาพ ข้อความ JSON CSV Data URL ZIP หรือไฟล์ต้นฉบับที่เปลี่ยนชื่อ" },
    archive: { name: "เครื่องมือบีบอัด", category: "บีบอัด", description: "รวมไฟล์เป็น ZIP พร้อมจัดโฟลเดอร์ ระดับการบีบอัด และ manifest" },
    batch: { name: "งานชุด", category: "ชุด", description: "เปลี่ยนชื่อ จัดเรียง ติดแท็ก ทำตัวพิมพ์เล็ก/ใหญ่ หรือใส่เลขไฟล์ แล้วดาวน์โหลดเป็น ZIP" },
    ocr: { name: "สถานี OCR", category: "OCR", description: "อ่านข้อความจากรูปภาพด้วย Tesseract และส่งออกเป็น TXT JSON หรือ ZIP" },
    metadata: { name: "ตรวจเมตาดาตา", category: "เมตา", description: "สร้างรายการข้อมูลไฟล์เป็น JSON CSV TXT หรือ HTML พร้อมชื่อ ชนิด ขนาด และเวลาแก้ไข" },
    checksum: { name: "สร้างแฮช", category: "แฮช", description: "สร้าง checksum สำหรับตรวจสอบไฟล์ เผยแพร่ไฟล์ และตรวจไฟล์ซ้ำ" },
    text: { name: "งานข้อความ", category: "ข้อความ", description: "ล้าง แปลง นับ และส่งออกไฟล์ข้อความเป็น TXT JSON CSV หรือ HTML" },
  },
}

const settings: Record<Language, Record<string, string>> = {
  en: {},
  th: {
    format: "ฟอร์แมตผลลัพธ์",
    quality: "คุณภาพ",
    resizeMode: "โหมดปรับขนาด",
    width: "ความกว้าง",
    height: "ความสูง",
    rotate: "หมุน",
    effect: "เอฟเฟกต์",
    flipHorizontal: "พลิกแนวนอน",
    action: "การทำงาน",
    pageRange: "ช่วงหน้า",
    linearize: "ใช้การปรับโครงสร้าง PDF",
    target: "ฟอร์แมตปลายทาง",
    renamePrefix: "คำนำหน้าชื่อไฟล์",
    bundle: "รวมผลลัพธ์เป็น ZIP",
    archiveName: "ชื่อไฟล์ ZIP",
    compression: "ระดับการบีบอัด",
    folderMode: "โหมดโฟลเดอร์",
    includeManifest: "แนบ manifest",
    operation: "รูปแบบงานชุด",
    pattern: "แพตเทิร์นชื่อไฟล์",
    startAt: "เลขเริ่มต้น",
    language: "ภาษา",
    output: "ผลลัพธ์",
    deskew: "ปรับคอนทราสต์ภาพก่อน OCR",
    includeDataUrl: "แนบ Data URL สำหรับไฟล์ขนาดเล็ก",
    algorithm: "อัลกอริทึม",
  },
}

const options: Record<Language, Record<string, string>> = {
  en: {},
  th: {
    Original: "ต้นฉบับ",
    WebP: "WebP",
    PNG: "PNG",
    JPEG: "JPEG",
    AVIF: "AVIF",
    "Keep size": "ขนาดเดิม",
    "Fit box": "พอดีกับกรอบ",
    "Exact size": "ขนาดกำหนดเอง",
    "Width only": "กำหนดความกว้าง",
    "Height only": "กำหนดความสูง",
    None: "ไม่มี",
    Grayscale: "ขาวดำ",
    Sepia: "ซีเปีย",
    Invert: "กลับสี",
    Inspect: "ตรวจสอบ",
    Merge: "รวม",
    Split: "แยก",
    Compress: "บีบอัด/บันทึกใหม่",
    "Extract pages": "ดึงหน้า",
    PDF: "PDF",
    TXT: "TXT",
    JSON: "JSON",
    CSV: "CSV",
    "Data URL": "Data URL",
    ZIP: "ZIP",
    "Keep original": "เก็บต้นฉบับ",
    Flat: "ไม่แยกโฟลเดอร์",
    "By extension": "ตามนามสกุลไฟล์",
    "By MIME type": "ตามชนิด MIME",
    Rename: "เปลี่ยนชื่อ",
    Sort: "จัดเรียง",
    Tag: "ติดแท็ก",
    Lowercase: "ตัวพิมพ์เล็ก",
    Uppercase: "ตัวพิมพ์ใหญ่",
    "Number only": "เลขอย่างเดียว",
    English: "อังกฤษ",
    Thai: "ไทย",
    Japanese: "ญี่ปุ่น",
    "Auto detect": "ตรวจอัตโนมัติ",
    HTML: "HTML",
    "Clean whitespace": "ล้างช่องว่าง",
    "Word count": "นับคำ",
    "Line sort": "เรียงบรรทัด",
    "Deduplicate lines": "ลบบรรทัดซ้ำ",
  },
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedLanguage = window.localStorage.getItem(storageKey)
      if (storedLanguage === "en" || storedLanguage === "th") setLanguageState(storedLanguage)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      setLanguageState(nextLanguage)
      window.localStorage.setItem(storageKey, nextLanguage)
      document.documentElement.lang = nextLanguage
    }

    return {
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "th" : "en"),
      t: (key: string) => common[language][key] ?? common.en[key] ?? key,
      toolText: (toolId, field) => tools[language][toolId]?.[field] ?? "",
      settingText: (_toolId, settingName, fallback) => settings[language][settingName] ?? fallback,
      optionText: (value) => options[language][value] ?? value,
    }
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider")
  return value
}
