# Gauss Document Studio 🔒

Gauss Document Studio is a private, high-fidelity, local-first offline workspace that combines a **Microsoft Word & Google Docs Clone** with an integrated suite of **30+ advanced PDF, security, conversion, and workflow utilities**. 

Gauss runs **100% client-side in the browser**. No files, text, or signatures are ever uploaded to a server, making it a perfect tool for privacy-sensitive professionals (lawyers, researchers, and office operators) who work under strict compliance guidelines.

---

## 🌟 Why Gauss Document Studio Was Created

1. **Absolute Data Privacy**: Online PDF tools and cloud document processors require you to upload confidential files to external servers. Gauss processes everything in browser sandbox memory.
2. **Local Web Worker Execution**: Large compilation tasks and heavy parsing filters are offloaded to background threads (`pdf.worker.ts`) to maintain a fluid 60FPS UI.
3. **Cohesive Workspace Integration**: Instead of separate isolated toolpages, Gauss unifies all utilities into a single document-centric studio. You can edit text, insert check boxes, visually redact items, sign, or chain actions into a single workflow.

---

## 🛠️ Complete Feature Index

### 1. Document Editor (Word/Docs Clone Core)
* **Local-First Database**: Persistent document profiles saved in local browser storage.
* **Rich Styling Toolbar**: Font Family, Font Size, Bold, Italic, Underline, Strikethrough, Text Color, and Highlight options.
* **Paragraph Alignments**: Left, Center, Right, Justify alignment, bulleted lists, numbered lists, and indents.
* **Insertions**: Layout tables, images (attachments/local), hyperlinks, and page breakers.
* **Layout Presets**: Margin profiles (Normal, Narrow, Wide), page size configurations (A4, Letter, Legal), and page orientation switches (Portrait, Landscape).
* **Ruler & Canvas**: Angled visual watermarks and dynamic page numbering rendered in real-time.

### 2. Interactive PDF Forms
* **Form Field Designer**: Insert fillable text boxes, checkbox inputs, or select dropdown selectors into the document canvas.
* **Interactive PDF Export**: These elements compile directly into native, interactive PDF form controls.

### 3. PDF Page Operations
* **Organize PDF**: Visual page grid preview. Drag, reorder, delete, or insert blank pages.
* **Rotate PDF**: Rotates pages individually or globally by 90°, 180°, or 270°.
* **Crop PDF**: Trim borders and adjust cropping box dimensions via slider points.
* **Merge & Split PDF**: Drag-and-drop multiple PDFs to merge them into one file, or split page ranges (`1-3,5`) into individual PDFs.
* **Compress PDF**: Optimize object streams and adjust image compression parameters to shrink file size.
* **Repair PDF**: Re-align structural headers and reconstruct corrupted cross-reference tables locally.
* **OCR PDF**: Scan images or scanned pages with local OCR (Tesseract.js) to extract searchable, copyable text.

### 4. Converter Suite
* **Convert to PDF**:
  * **Word to PDF**: Compile editor paragraphs to clean PDF page nodes.
  * **Excel to PDF**: Import tabular spreadsheets (CSV) and layout clean gridlines.
  * **PowerPoint to PDF**: Structure outline summaries into styled presentation frames.
  * **HTML to PDF**: Read and layout raw HTML code into standard PDF templates.
  * **Scan to PDF**: webcam/device camera scanner simulator with perspective outline boundaries and shutter frames.
* **Convert from PDF**:
  * **PDF to JPG**: Zipped high-res JPEG slide extraction.
  * **PDF to Word**: Convert PDF blocks into editable paragraphs in the Docs editor canvas.
  * **PDF to PPT**: Map PDF content into presentation slides.
  * **PDF to Excel**: Parse layout tables and download CSV spreadsheets.
  * **PDF to PDF/A**: Stamp conformance headers and archival metadata profiles.

### 5. Document Security & Trust
* **Protect PDF**: Secure files locally with user and owner passwords.
* **Unlock PDF**: Decrypt password-protected files in Gauss sandbox.
* **Electronic Signatures**: Canvas pad to draw cursive signatures, type styled scripts, or stamp signature images.
* **Redact PDF**: Use a visual redaction brush to blackout sensitive text or shapes permanently.
* **Compare PDF**: Highlight insertions and deletions between two document versions side-by-side.

### 6. AI Suite & Productivity Tools
* **AI Summarizer**: Offline summarization, key points extractor, reading times estimator, and readability score calculator.
* **Translate PDF**: Stamp localized translation layers (Thai, Japanese, Spanish, German) onto pages.
* **Custom Workflows**: Chain multiple operations (e.g. *OCR Scan -> Grayscale Vector -> Add Watermark -> Encrypt*) in a visual node pipeline and execute them in sequence.
* **Cloud Mirror Simulator**: Connection sync triggers for Google Drive & Dropbox backups with live mirror logging.
* **Device Preview Frames**: Wrapper chassis frames simulating app runtime on macOS, Windows, iOS iPhone, and Android.
* **Developer API Sandbox**: Visual sandbox console presenting JSON request/response formats.

---

## 💻 Tech Stack

* **Core Framework**: Next.js 16 (Turbopack) & React 19
* **Styling**: Tailwind CSS 4
* **Local Parsing**: `pdf-lib` (PDF compilation/saving) & `JSZip` (archiving)
* **Local Vision**: `Tesseract.js` (OCR text scanning)
* **State & Icons**: Lucide React icons & React local state management

---

## 🚀 Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access the studio.

3. **Verify Builds & Lints**:
   ```bash
   npm run build
   ```
