export type ToolSettingValue = string | number | boolean;

export type ToolSettings = Record<string, ToolSettingValue>;

export type ToolSetting = {
  name: string;
  label: string;
  type: "slider" | "select" | "checkbox" | "text";
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
    id: "image",
    name: "Image Lab",
    category: "Media & Vision",
    description: "Convert, resize, rotate, flip, and stylize images into browser-supported output formats.",
    acceptedFileTypes: ["image/*"],
    processingMode: "client",
    settingsSchema: [
      { name: "format", label: "Output format", type: "select", options: ["Original", "WebP", "PNG", "JPEG", "AVIF"], defaultValue: "WebP" },
      { name: "quality", label: "Quality", type: "slider", min: 10, max: 100, step: 5, defaultValue: 85 },
      { name: "resizeMode", label: "Resize mode", type: "select", options: ["Keep size", "Fit box", "Exact size", "Width only", "Height only"], defaultValue: "Keep size" },
      { name: "width", label: "Width", type: "slider", min: 64, max: 4096, step: 16, defaultValue: 1920 },
      { name: "height", label: "Height", type: "slider", min: 64, max: 4096, step: 16, defaultValue: 1080 },
      { name: "rotate", label: "Rotate", type: "select", options: ["0", "90", "180", "270"], defaultValue: "0" },
      { name: "effect", label: "Effect", type: "select", options: ["None", "Grayscale", "Sepia", "Invert"], defaultValue: "None" },
      { name: "flipHorizontal", label: "Flip horizontal", type: "checkbox", defaultValue: false },
    ],
  },
  {
    id: "pdf",
    name: "PDF Desk",
    category: "Documents & Text",
    description: "Inspect, merge, split, extract page summaries, apply Bates stamping, or convert to grayscale locally.",
    acceptedFileTypes: ["application/pdf", ".pdf"],
    processingMode: "client",
    settingsSchema: [
      { name: "action", label: "Action", type: "select", options: ["Inspect", "Merge", "Split", "Compress", "Extract pages", "Bates Stamping"], defaultValue: "Merge" },
      { name: "batesPrefix", label: "Bates Prefix", type: "text", defaultValue: "CONFIDENTIAL-" },
      { name: "batesStart", label: "Bates Start Index", type: "slider", min: 1, max: 10000, step: 1, defaultValue: 1 },
      { name: "batesPadding", label: "Bates Digit Padding", type: "slider", min: 1, max: 8, step: 1, defaultValue: 6 },
      { name: "batesPosition", label: "Bates Position", type: "select", options: ["Top Left", "Top Center", "Top Right", "Bottom Left", "Bottom Center", "Bottom Right"], defaultValue: "Bottom Right" },
      { name: "grayscale", label: "Apply Vector Grayscale", type: "checkbox", defaultValue: false },
      { name: "pageRange", label: "Page range", type: "text", defaultValue: "1-9999" },
      { name: "linearize", label: "Use object-stream optimization", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "converter",
    name: "Format Converter",
    category: "File Operations",
    description: "Convert supported files to PDF, images, text, JSON, CSV, data URLs, ZIP, or renamed originals.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [
      { name: "target", label: "Target format", type: "select", options: ["Keep original", "PDF", "PNG", "JPEG", "WebP", "TXT", "JSON", "CSV", "Data URL", "ZIP"], defaultValue: "ZIP" },
      { name: "renamePrefix", label: "Filename prefix", type: "text", defaultValue: "gauss" },
      { name: "bundle", label: "Bundle outputs as ZIP", type: "checkbox", defaultValue: false },
    ],
  },
  {
    id: "archive",
    name: "Archive Bench",
    category: "File Operations",
    description: "Package selected files into a ZIP with folder organization, compression, and optional manifest.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [
      { name: "archiveName", label: "Archive name", type: "text", defaultValue: "gauss-pack" },
      { name: "compression", label: "Compression level", type: "slider", min: 0, max: 9, step: 1, defaultValue: 6 },
      { name: "folderMode", label: "Folder mode", type: "select", options: ["Flat", "By extension", "By MIME type"], defaultValue: "By extension" },
      { name: "includeManifest", label: "Include manifest", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "batch",
    name: "Batch Console",
    category: "File Operations",
    description: "Rename, sort, tag, lowercase, uppercase, or number files and download the batch as a ZIP.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [
      { name: "operation", label: "Operation", type: "select", options: ["Rename", "Sort", "Tag", "Lowercase", "Uppercase", "Number only"], defaultValue: "Rename" },
      { name: "pattern", label: "Pattern", type: "text", defaultValue: "{index}-{name}" },
      { name: "startAt", label: "Start number", type: "slider", min: 0, max: 999, step: 1, defaultValue: 1 },
    ],
  },
  {
    id: "ocr",
    name: "OCR Station",
    category: "Media & Vision",
    description: "Extract text from images with Tesseract and export text, JSON, or a searchable text bundle.",
    acceptedFileTypes: ["image/*", "text/plain", ".txt"],
    processingMode: "client",
    settingsSchema: [
      { name: "language", label: "Language", type: "select", options: ["English", "Thai", "Japanese", "Auto detect"], defaultValue: "English" },
      { name: "output", label: "Output", type: "select", options: ["TXT", "JSON", "ZIP"], defaultValue: "TXT" },
      { name: "deskew", label: "Preprocess image contrast", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "metadata",
    name: "Metadata Inspector",
    category: "Data & Security",
    description: "Generate file inventories as JSON, CSV, TXT, or HTML with names, types, sizes, and timestamps.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [
      { name: "format", label: "Report format", type: "select", options: ["JSON", "CSV", "TXT", "HTML"], defaultValue: "JSON" },
      { name: "includeDataUrl", label: "Include small-file data URLs", type: "checkbox", defaultValue: false },
    ],
  },
  {
    id: "checksum",
    name: "Checksum Forge",
    category: "Data & Security",
    description: "Create cryptographic checksums for verification, publishing, and duplicate checks.",
    acceptedFileTypes: ["*/*"],
    processingMode: "client",
    settingsSchema: [
      { name: "algorithm", label: "Algorithm", type: "select", options: ["SHA-256", "SHA-384", "SHA-512"], defaultValue: "SHA-256" },
      { name: "format", label: "Output format", type: "select", options: ["TXT", "CSV", "JSON"], defaultValue: "TXT" },
    ],
  },
  {
    id: "text",
    name: "Text Workshop",
    category: "Documents & Text",
    description: "Clean, transform, count, and export text files into TXT, JSON, CSV, or HTML.",
    acceptedFileTypes: ["text/*", ".txt", ".csv", ".json", ".md", ".html", ".xml"],
    processingMode: "client",
    settingsSchema: [
      { name: "action", label: "Action", type: "select", options: ["Clean whitespace", "Uppercase", "Lowercase", "Word count", "Line sort", "Deduplicate lines"], defaultValue: "Clean whitespace" },
      { name: "output", label: "Output format", type: "select", options: ["TXT", "JSON", "CSV", "HTML"], defaultValue: "TXT" },
    ],
  },
];

export const getToolById = (id: string) => toolRegistry.find((tool) => tool.id === id);

export const getDefaultSettings = (tool: Tool): ToolSettings =>
  Object.fromEntries(tool.settingsSchema.map((setting) => [setting.name, setting.defaultValue]));
