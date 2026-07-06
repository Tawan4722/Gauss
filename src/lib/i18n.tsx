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
    "category.media": "Media & Vision",
    "category.docs": "Documents & Text",
    "category.files": "File Operations",
    "category.security": "Data & Security",
    "category.pdf": "PDF Operations",
    "category.conversions": "Conversions",
    "category.ai": "AI Suite",
    "category.productivity": "Productivity",
    "category.all": "All Utilities",
  },
  th: {
    "nav.tools": "เครื่องมือ",
    "nav.settings": "ตั้งค่า",
    "nav.language": "EN",
    "home.badge": "จัดการไฟล์ครบในที่เดียว",
    "home.description": "พื้นที่ทำงานส่วนตัวสำหรับจัดการไฟล์ในเบราว์เซอร์ รองรับรูปภาพ PDF แปลงไฟล์ ZIP งานชุด OCR เมตาดาตา แฮช และข้อความ",
    "home.start": "เริ่มใช้งาน",
    "home.viewTools": "ดูเครื่องมือทั้งหมด",
    "home.uploadTitle": "เลือกไฟล์",
    "home.uploadDescription": "เปิดเครื่องมือแปลงไฟล์ ลากไฟล์เข้ามา ปรับตัวเลือก แล้วดาวน์โหลดผลลัพธ์ได้ทันที",
    "all.badge": "โหมดรวมทุกเครื่องมือ",
    "all.title": "ใช้ทุกเครื่องมือของ Gauss ได้ในหน้าเดียว",
    "all.description": "เลือกเครื่องมือ อัปโหลดไฟล์ ปรับตัวเลือก ประมวลผลในเบราว์เซอร์ แล้วดาวน์โหลดผลลัพธ์จริง",
    "workspace.dropTitle": "ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์",
    "workspace.accepted": "รองรับไฟล์",
    "workspace.local": "ไฟล์ถูกประมวลผลในเบราว์เซอร์ของคุณ",
    "workspace.selected": "ไฟล์ที่เลือก",
    "workspace.noFiles": "ยังไม่มีไฟล์",
    "workspace.clear": "ล้างทั้งหมด",
    "workspace.remove": "ลบ",
    "workspace.settings": "ตัวเลือก",
    "workspace.process": "ประมวลผล",
    "workspace.processing": "กำลังทำงาน...",
    "workspace.outputs": "ผลลัพธ์",
    "workspace.outputHint": "ประมวลผลเพื่อสร้างไฟล์ดาวน์โหลด",
    "workspace.download": "ดาวน์โหลด",
    "workspace.downloadAll": "ดาวน์โหลดทั้งหมด",
    "workspace.addFiles": "กรุณาเพิ่มไฟล์ก่อนประมวลผล",
    "workspace.failed": "ประมวลผลไม่สำเร็จ กรุณาตรวจสอบไฟล์แล้วลองใหม่",
    "settings.badge": "ตั้งค่า",
    "settings.title": "ตั้งค่าพื้นที่ทำงาน",
    "settings.description": "การตั้งค่าจะถูกเก็บไว้ในเบราว์เซอร์นี้เท่านั้น ไม่ต้องใช้บัญชีหรือเซิร์ฟเวอร์",
    "settings.reduceMotion": "ลดแอนิเมชัน",
    "settings.reduceMotionHelp": "ลดการเคลื่อนไหวของหน้าจอเมื่อระบบรองรับ",
    "settings.rememberLastTool": "จำเครื่องมือล่าสุด",
    "settings.rememberLastToolHelp": "เตรียมไว้สำหรับเปิดเครื่องมือล่าสุดอัตโนมัติในอนาคต",
    "settings.privateMode": "โหมดส่วนตัว",
    "settings.privateModeHelp": "ประมวลผลไฟล์ในเบราว์เซอร์เป็นหลัก เว้นแต่จะเพิ่มระบบเซิร์ฟเวอร์ภายหลัง",
    "settings.saved": "บันทึกแล้ว",
    "settings.resetStatus": "รีเซ็ตเป็นค่าเริ่มต้นแล้ว",
    "settings.invalid": "ข้อมูลการตั้งค่าเดิมไม่ถูกต้อง ระบบจึงรีเซ็ตให้แล้ว",
    "settings.status": "การตั้งค่าถูกเก็บไว้ในเบราว์เซอร์นี้",
    "settings.reset": "รีเซ็ต",
    "category.media": "สื่อและรูปภาพ",
    "category.docs": "เอกสารและข้อความ",
    "category.files": "จัดการไฟล์",
    "category.security": "ข้อมูลและความปลอดภัย",
    "category.pdf": "จัดการ PDF",
    "category.conversions": "แปลงไฟล์",
    "category.ai": "ชุดเครื่องมือ AI",
    "category.productivity": "ผลงานและประสิทธิภาพ",
    "category.all": "เครื่องมือทั้งหมด",
  },
}

const tools: Record<Language, Record<string, { name: string; category: string; description: string }>> = {
  en: {},
  th: {
    editor: { name: "ตัวแก้ไขเอกสาร", category: "เอกสารและข้อความ", description: "เขียน ตกแต่ง และจัดโครงสร้างเอกสารภายในเครื่องพร้อมนับคำและฟิลด์ฟอร์มแบบโต้ตอบ" },
    "organize-pdf": { name: "จัดระเบียบ PDF", category: "จัดการ PDF", description: "เรียงลำดับใหม่ หมุน ครอป ลบ และเพิ่มหน้าสำหรับเลย์เอาต์ PDF ที่กำหนดเอง" },
    "merge-pdf": { name: "รวม PDF", category: "จัดการ PDF", description: "รวมไฟล์ PDF หลายไฟล์เข้าด้วยกันตามลำดับที่ต้องการ" },
    "split-pdf": { name: "แยก PDF", category: "จัดการ PDF", description: "แยกหน้าเอกสารหรือช่วงหน้าที่ต้องการออกจากไฟล์ PDF" },
    "rotate-pdf": { name: "หมุน PDF", category: "จัดการ PDF", description: "หมุนเฉพาะบางหน้าหรือทุกหน้าของเอกสาร PDF" },
    "crop-pdf": { name: "ครอป PDF", category: "จัดการ PDF", description: "ตัดขอบกระดาษหรือตั้งค่าขนาดหน้ากระดาษแบบกำหนดเองสำหรับไฟล์ PDF" },
    "compress-pdf": { name: "บีบอัด PDF", category: "จัดการ PDF", description: "ลดขนาดไฟล์ PDF โดยการบีบอัดรูปภาพและสตรีมการประมวลผล" },
    "repair-pdf": { name: "ซ่อมแซม PDF", category: "จัดการ PDF", description: "กู้คืนโครงสร้างหัวข้อ PDF ที่เสียหายและสร้างตารางอ้างอิงข้ามในเครื่อง" },
    "ocr-pdf": { name: "อ่านข้อความ PDF", category: "จัดการ PDF", description: "สแกนหน้า PDF ด้วยระบบ OCR (Tesseract) ในเครื่องเพื่อให้สามารถค้นหาและแก้ไขข้อความได้" },
    "word-to-pdf": { name: "แปลง Word เป็น PDF", category: "แปลงไฟล์", description: "ส่งออกไฟล์ Microsoft Word หรือ Google Docs เป็นรูปแบบ PDF ที่ปลอดภัยโดยตรง" },
    "excel-to-pdf": { name: "แปลง Excel เป็น PDF", category: "แปลงไฟล์", description: "แปลงสเปรดชีตตาราง (CSV/XLSX) เป็นหน้า PDF ที่สะอาดและเป็นระเบียบ" },
    "ppt-to-pdf": { name: "แปลง PowerPoint เป็น PDF", category: "แปลงไฟล์", description: "แปลงโครงร่างสไลด์หรือการนำเสนอเป็นสไลด์ PDF ที่จัดหน้าอย่างเรียบร้อย" },
    "html-to-pdf": { name: "แปลง HTML เป็น PDF", category: "แปลงไฟล์", description: "คอมไพล์และจัดเลย์เอาต์โค้ด HTML ดิบลงในเทมเพลต PDF มาตรฐาน" },
    "scan-to-pdf": { name: "สแกนเป็น PDF", category: "แปลงไฟล์", description: "ใช้กล้องของอุปกรณ์เพื่อสแกนเอกสารกระดาษและแปลงเป็นหน้า PDF" },
    "pdf-to-jpg": { name: "แปลง PDF เป็น JPG", category: "แปลงไฟล์", description: "แปลงหน้าเอกสาร PDF เป็นรูปภาพ JPEG ในไฟล์บีบอัด ZIP" },
    "pdf-to-word": { name: "แปลง PDF เป็น Word", category: "แปลงไฟล์", description: "ดึงโครงสร้างข้อความจาก PDF เป็นย่อหน้าที่แก้ไขได้ในตัวแก้ไข Gauss" },
    "pdf-to-ppt": { name: "แปลง PDF เป็น PPT", category: "แปลงไฟล์", description: "แปลงส่วนของเอกสารและสไลด์โครงร่างเป็นรูปทรงการนำเสนอ" },
    "pdf-to-excel": { name: "แปลง PDF เป็น Excel", category: "แปลงไฟล์", description: "ดึงตารางข้อมูลที่มีโครงสร้างจากรายงาน PDF เป็นสเปรดชีต CSV" },
    "pdf-to-pdfa": { name: "แปลง PDF เป็น PDF/A", category: "แปลงไฟล์", description: "ประทับตราเมตาดาตาสำหรับจัดเก็บและจัดรูปแบบเอกสารตามมาตรฐาน PDF/A" },
    "protect-pdf": { name: "ป้องกัน PDF", category: "ความปลอดภัยและน่าเชื่อถือ", description: "ป้องกันเอกสาร PDF ของคุณด้วยการเข้ารหัสรหัสผ่านที่ปลอดภัย" },
    "unlock-pdf": { name: "ปลดล็อก PDF", category: "ความปลอดภัยและน่าเชื่อถือ", description: "ลบรหัสผ่านและการล็อกความปลอดภัยออกจากไฟล์ PDF ที่ได้รับอนุญาต" },
    "sign-pdf": { name: "เซ็นชื่อ PDF", category: "ความปลอดภัยและน่าเชื่อถือ", description: "วาด พิมพ์ หรือนำเข้าลายเซ็นดิจิทัลเพื่อประทับลงบนหน้าเอกสาร PDF" },
    "redact-pdf": { name: "เซ็นเซอร์ PDF", category: "ความปลอดภัยและน่าเชื่อถือ", description: "ปิดดำข้อความหรือส่วนที่ละเอียดอ่อนอย่างถาวรจากสตรีมไบนารี PDF" },
    "compare-pdf": { name: "เปรียบเทียบ PDF", category: "ความปลอดภัยและน่าเชื่อถือ", description: "เปรียบเทียบเอกสาร PDF สองฉบับเพื่อตรวจสอบและไฮไลต์ส่วนที่แก้ไขโดยละเอียด" },
    "watermark-pdf": { name: "ใส่ลายน้ำ", category: "ความปลอดภัยและน่าเชื่อถือ", description: "ใส่ลายน้ำข้อความหรือบล็อกลายเซ็นแบบจัดตำแหน่งได้อย่างอิสระ" },
    "ai-summarizer": { name: "สรุปความด้วย AI", category: "ชุดเครื่องมือ AI", description: "สร้างสรุปเนื้อหา ประเด็นสำคัญ คะแนนความอ่านง่าย และข้อมูลเชิงลึกแบบออฟไลน์" },
    "translate-pdf": { name: "แปลภาษา PDF", category: "ชุดเครื่องมือ AI", description: "แปลย่อหน้าที่เลือกหรือเอกสารทั้งหมดเป็นภาษาอื่นแบบออฟไลน์" },
    workflows: { name: "เวิร์กโฟลว์ที่กำหนดเอง", category: "ผลงานและประสิทธิภาพ", description: "เชื่อมโยงการทำงานหลายอย่างของ PDF เข้าด้วยกันเป็นขั้นตอนเดียว" },
    "cloud-sync": { name: "เชื่อมต่อคลาวด์", category: "ผลงานและประสิทธิภาพ", description: "จำลองและตั้งค่าการสำรองข้อมูลตามเวลาจริงและการซิงก์โฟลเดอร์กับ Google Drive และ Dropbox" },
    "desktop-app": { name: "แอปพลิเคชันเดสก์ท็อป", category: "ผลงานและประสิทธิภาพ", description: "พรีวิวแอปที่ทำงานบนไคลเอนต์ภายในกรอบแอป macOS และ Windows แบบเต็มรูปแบบ" },
    "mobile-app": { name: "แอปพลิเคชันมือถือ", category: "ผลงานและประสิทธิภาพ", description: "พรีวิวตัวแก้ไขบนไคลเอนต์ที่ปรับให้เหมาะกับหน้าจอมือถือ iOS และ Android" },
    "developer-api": { name: "API สำหรับนักพัฒนา", category: "ผลงานและประสิทธิภาพ", description: "ดูรายละเอียดการเชื่อมต่อจำลอง แซนด์บ็อกซ์ API และข้อมูล JSON สำหรับการทำงานอัตโนมัติ" },
    image: { name: "จัดการรูปภาพ", category: "สื่อและรูปภาพ", description: "แปลงไฟล์ ปรับขนาด หมุน พลิก และใส่เอฟเฟกต์ให้รูปภาพ" },
    converter: { name: "แปลงไฟล์", category: "จัดการไฟล์", description: "แปลงไฟล์เป็น PDF รูปภาพ TXT JSON CSV Data URL ZIP หรือเก็บต้นฉบับพร้อมเปลี่ยนชื่อ" },
    archive: { name: "สร้าง ZIP", category: "จัดการไฟล์", description: "รวมไฟล์เป็น ZIP เลือกระดับบีบอัด จัดโฟลเดอร์ และแนบ manifest ได้" },
    batch: { name: "จัดการหลายไฟล์", category: "จัดการไฟล์", description: "เปลี่ยนชื่อ จัดเรียง ติดแท็ก เปลี่ยนตัวพิมพ์ หรือใส่เลขให้หลายไฟล์พร้อมกัน" },
    ocr: { name: "อ่านข้อความ", category: "สื่อและรูปภาพ", description: "อ่านข้อความจากรูปภาพด้วย Tesseract แล้วส่งออกเป็น TXT JSON หรือ ZIP" },
    metadata: { name: "ข้อมูลไฟล์", category: "ข้อมูลและความปลอดภัย", description: "สร้างรายงานชื่อไฟล์ ประเภท ขนาด นามสกุล และเวลาแก้ไข" },
    checksum: { name: "สร้างแฮช", category: "ข้อมูลและความปลอดภัย", description: "สร้าง SHA checksum สำหรับตรวจสอบไฟล์หรือเช็กไฟล์ซ้ำ" },
    text: { name: "จัดการข้อความ", category: "เอกสารและข้อความ", description: "ล้างช่องว่าง เปลี่ยนตัวพิมพ์ นับคำ เรียงบรรทัด และลบบรรทัดซ้ำ" },
  },
}

const settings: Record<Language, Record<string, string>> = {
  en: {},
  th: {
    format: "ฟอร์แมต",
    quality: "คุณภาพ",
    resizeMode: "การปรับขนาด",
    width: "ความกว้าง",
    height: "ความสูง",
    rotate: "หมุน",
    effect: "เอฟเฟกต์",
    flipHorizontal: "พลิกซ้าย-ขวา",
    action: "คำสั่ง",
    pageRange: "ช่วงหน้า",
    linearize: "ปรับโครงสร้าง PDF",
    target: "แปลงเป็น",
    renamePrefix: "คำนำหน้าชื่อไฟล์",
    bundle: "รวมเป็น ZIP",
    archiveName: "ชื่อ ZIP",
    compression: "ระดับบีบอัด",
    folderMode: "การจัดโฟลเดอร์",
    includeManifest: "แนบ manifest",
    operation: "คำสั่งงานชุด",
    pattern: "รูปแบบชื่อไฟล์",
    startAt: "เลขเริ่มต้น",
    language: "ภาษา",
    output: "ส่งออกเป็น",
    deskew: "ปรับภาพก่อน OCR",
    includeDataUrl: "แนบ Data URL สำหรับไฟล์เล็ก",
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
    "Fit box": "พอดีกรอบ",
    "Exact size": "ขนาดกำหนดเอง",
    "Width only": "กำหนดเฉพาะกว้าง",
    "Height only": "กำหนดเฉพาะสูง",
    None: "ไม่มี",
    Grayscale: "ขาวดำ",
    Sepia: "ซีเปีย",
    Invert: "กลับสี",
    Inspect: "ตรวจสอบ",
    Merge: "รวมไฟล์",
    Split: "แยกหน้า",
    Compress: "บีบอัด",
    "Extract pages": "ดึงหน้า",
    PDF: "PDF",
    TXT: "TXT",
    JSON: "JSON",
    CSV: "CSV",
    "Data URL": "Data URL",
    ZIP: "ZIP",
    "Keep original": "เก็บต้นฉบับ",
    Flat: "ไม่แยกโฟลเดอร์",
    "By extension": "ตามนามสกุล",
    "By MIME type": "ตามชนิดไฟล์",
    Rename: "เปลี่ยนชื่อ",
    Sort: "จัดเรียง",
    Tag: "ติดแท็ก",
    Lowercase: "ตัวพิมพ์เล็ก",
    Uppercase: "ตัวพิมพ์ใหญ่",
    "Number only": "ใช้เลขล้วน",
    English: "อังกฤษ",
    Thai: "ไทย",
    Japanese: "ญี่ปุ่น",
    "Auto detect": "อัตโนมัติ",
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