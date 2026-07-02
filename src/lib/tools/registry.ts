export type ToolSettingValue = string | number | boolean;

export type ToolSettings = Record<string, ToolSettingValue>;

export type ToolSetting = {
  name: string;
  label: string;
  type: "slider" | "select" | "checkbox" | "text" | "password";
  min?: number;
  max?: number;
  step?: number;
  defaultValue: ToolSettingValue;
  options?: string[];
};

export type Tool = {
  id: string;
  name: string;
  category: string;
  description: string;
  acceptedFileTypes: string[];
  processingMode: "client" | "server" | "hybrid";
  settingsSchema: ToolSetting[];
};

export const toolRegistry: Tool[] = [
  {
    id: "editor",
    name: "Document Editor",
    category: "Documents & Text",
    description: "Write, style, and structure documents locally with real-time word counting, layouts, and interactive form fields.",
    acceptedFileTypes: ["text/*", ".txt", ".docx", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "organize-pdf",
    name: "Organize PDF",
    category: "PDF Operations",
    description: "Reorder, rotate, crop, delete, and add pages to custom PDF layouts.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    category: "PDF Operations",
    description: "Combine multiple PDF documents into a single file in the exact order you want.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "linearize", label: "Use object-stream optimization", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    category: "PDF Operations",
    description: "Extract page ranges or individual pages from a PDF document into a new file.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "pageRange", label: "Page range", type: "text", defaultValue: "1-9999" },
      { name: "linearize", label: "Use object-stream optimization", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    category: "PDF Operations",
    description: "Rotate individual pages or all pages of a PDF document.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "angle", label: "Rotation angle", type: "select", options: ["90", "180", "270"], defaultValue: "90" }
    ],
  },
  {
    id: "crop-pdf",
    name: "Crop PDF",
    category: "PDF Operations",
    description: "Trim page margins or set custom page dimension boxes for PDF files.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "margin", label: "Crop Margin (pt)", type: "slider", min: 10, max: 150, defaultValue: 40 }
    ],
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    category: "PDF Operations",
    description: "Reduce file size of PDF documents by compressing images and optimization streams.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "quality", label: "Image Quality (%)", type: "slider", min: 10, max: 100, defaultValue: 70 }
    ],
  },
  {
    id: "repair-pdf",
    name: "Repair PDF",
    category: "PDF Operations",
    description: "Recover corrupt PDF structure headers and restore document cross-reference tables locally.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "ocr-pdf",
    name: "OCR PDF",
    category: "PDF Operations",
    description: "Scan pages of a PDF using local OCR (Tesseract) to make contents searchable and editable.",
    acceptedFileTypes: ["application/pdf", "image/*", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "language", label: "OCR Language", type: "select", options: ["English", "Thai", "Japanese"], defaultValue: "English" }
    ],
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    category: "Conversions",
    description: "Export rich Microsoft Word or Google Docs files directly to secure PDF formats.",
    acceptedFileTypes: [".docx", "text/plain"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    category: "Conversions",
    description: "Convert tabular spreadsheets (CSV/XLSX) to clean, structured PDF pages.",
    acceptedFileTypes: [".csv", ".xlsx", "text/csv"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "ppt-to-pdf",
    name: "PowerPoint to PDF",
    category: "Conversions",
    description: "Translate slide outlines or presentations into clean, paginated PDF slides.",
    acceptedFileTypes: [".pptx", ".ppt"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    category: "Conversions",
    description: "Compile and layout raw HTML code into standard PDF templates.",
    acceptedFileTypes: ["text/html", ".html"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "scan-to-pdf",
    name: "Scan to PDF",
    category: "Conversions",
    description: "Use your device camera to scan paper documents and convert them to formatted PDF pages.",
    acceptedFileTypes: ["image/*"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "Conversions",
    description: "Convert PDF document pages to clean JPEG images inside a zip bundle.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "quality", label: "JPEG Quality", type: "slider", min: 50, max: 100, defaultValue: 90 }
    ],
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    category: "Conversions",
    description: "Extract text structures from PDFs to editable paragraphs inside the Gauss editor.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "pdf-to-ppt",
    name: "PDF to PPT",
    category: "Conversions",
    description: "Convert document sections and outline slides into presentation shapes.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    category: "Conversions",
    description: "Extract structured tabular grids from PDF reports into clean CSV spreadsheets.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "pdf-to-pdfa",
    name: "PDF to PDF/A",
    category: "Conversions",
    description: "Stamps archival metadata and formats documents to PDF/A compliance standards.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    category: "Security & Trust",
    description: "Secure your PDF document with strong password encryption.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "password", label: "User Password", type: "password", defaultValue: "" },
      { name: "ownerPassword", label: "Owner Password", type: "password", defaultValue: "" }
    ],
  },
  {
    id: "unlock-pdf",
    name: "Unlock PDF",
    category: "Security & Trust",
    description: "Remove passwords and security locks from authorized PDF files.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "password", label: "Password", type: "password", defaultValue: "" }
    ],
  },
  {
    id: "sign-pdf",
    name: "Sign PDF",
    category: "Security & Trust",
    description: "Draw, type, or import digital signatures to stamp onto PDF document pages.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "redact-pdf",
    name: "Redact PDF",
    category: "Security & Trust",
    description: "Black-out sensitive text or sections permanently from the PDF binary streams.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "compare-pdf",
    name: "Compare PDF",
    category: "Security & Trust",
    description: "Compare two PDF documents to visually inspect and highlight text modifications.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "watermark-pdf",
    name: "Add Watermark",
    category: "Security & Trust",
    description: "Apply text watermarks and signatures to document pages in an interactive sandbox.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "watermarkText", label: "Watermark Label", type: "text", defaultValue: "DRAFT" },
      { name: "watermarkSize", label: "Font Size", type: "slider", min: 12, max: 120, step: 2, defaultValue: 60 },
      { name: "watermarkOpacity", label: "Opacity", type: "slider", min: 0.05, max: 0.5, step: 0.05, defaultValue: 0.15 },
      { name: "linearize", label: "Use object-stream optimization", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "ai-summarizer",
    name: "AI Summarizer",
    category: "AI Suite",
    description: "Generate key summaries, takeaways, readability scores, and insights offline.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "translate-pdf",
    name: "Translate PDF",
    category: "AI Suite",
    description: "Translate selected paragraphs or complete documents to other languages offline.",
    acceptedFileTypes: ["application/pdf", ".pdf", "text/plain"],
    processingMode: "client",
    settingsSchema: [
      { name: "targetLanguage", label: "Target Language", type: "select", options: ["Thai", "Japanese", "Spanish", "German"], defaultValue: "Thai" }
    ],
  },
  {
    id: "workflows",
    name: "Custom Workflows",
    category: "Productivity",
    description: "Chain multiple PDF actions together (e.g. OCR -> Watermark -> Protect) into a single flow.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "cloud-sync",
    name: "Cloud Integration",
    category: "Productivity",
    description: "Simulate and configure real-time backups and folder mirrors with Google Drive and Dropbox.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "desktop-app",
    name: "Desktop Application",
    category: "Productivity",
    description: "Preview the client-side app running inside full macOS and Windows app frames.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "mobile-app",
    name: "Mobile Application",
    category: "Productivity",
    description: "Preview the client-side editor optimized inside iOS and Android mobile screens.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [],
  },
  {
    id: "developer-api",
    name: "Developer API",
    category: "Productivity",
    description: "View mock integration details, sandbox APIs, and JSON payloads for local automation.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [],
  }
];

export const getToolById = (id: string) => toolRegistry.find((tool) => tool.id === id);

export const getDefaultSettings = (tool: Tool): ToolSettings =>
  Object.fromEntries(tool.settingsSchema.map((setting) => [setting.name, setting.defaultValue]));
