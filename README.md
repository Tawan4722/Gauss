# Gauss

Gauss is a private, browser-first, all-in-one file utility workspace built with Next.js. It lets users upload files, choose a tool, adjust options, process files locally, and download real outputs without requiring an account or server upload pipeline.

Gauss รองรับภาษาไทยและอังกฤษ ผู้ใช้สามารถสลับภาษาได้จากปุ่มภาษาในแถบนำทาง และค่าภาษาจะถูกบันทึกไว้ในเบราว์เซอร์

## Features

- Bilingual UI: English and Thai.
- Proper Thai typography using Noto Sans Thai.
- All-in-one workspace at `/tools` with a balanced segmented tool picker.
- Individual routes for every tool, for example `/tools/image` and `/tools/pdf`.
- Local browser processing for supported workflows.
- Drag-and-drop file upload.
- Per-tool options and real downloadable outputs.
- Local settings stored in `localStorage`.

## Tools

### Image Lab

Supported input: images.

Functions:

- Convert to `Original`, `WebP`, `PNG`, `JPEG`, or `AVIF` when supported by the browser.
- Adjust quality.
- Resize with `Keep size`, `Fit box`, `Exact size`, `Width only`, or `Height only`.
- Rotate by `0`, `90`, `180`, or `270` degrees.
- Apply `None`, `Grayscale`, `Sepia`, or `Invert` effects.
- Flip horizontally.

Note: If a browser cannot encode AVIF, Gauss falls back to PNG output.

### PDF Desk

Supported input: PDFs.

Functions:

- Inspect PDF page counts and sizes.
- Merge PDFs.
- Split PDFs into one file per page.
- Re-save PDFs with object streams enabled or disabled.
- Extract selected page ranges, for example `1-3,5`.

### Format Converter

Supported input: any file.

Output choices:

- Keep original with renamed output.
- `PDF`
- `PNG`
- `JPEG`
- `WebP`
- `TXT`
- `JSON`
- `CSV`
- `Data URL`
- `ZIP`

For unsupported binary-to-image conversions, Gauss creates a label image that represents the file metadata instead of pretending a true binary conversion happened.

### Archive Bench

Supported input: any file.

Functions:

- Create ZIP archives.
- Choose compression level from `0` to `9`.
- Organize files flat, by extension, or by MIME type.
- Optionally include a JSON manifest.

### Batch Console

Supported input: any file.

Functions:

- Rename files using patterns like `{index}-{name}`.
- Sort files into folders by extension.
- Tag files and include a tag manifest.
- Convert output names to lowercase or uppercase.
- Rename files using numbers only.

### OCR Station

Supported input: images and text files.

Functions:

- Extract text from images using Tesseract.js.
- Languages: English, Thai, Japanese, or combined auto mode.
- Optional contrast preprocessing.
- Export as `TXT`, `JSON`, or `ZIP`.

Note: OCR language data is downloaded by Tesseract.js on first use.

### Metadata Inspector

Supported input: any file.

Functions:

- Export file inventory as `JSON`, `CSV`, `TXT`, or `HTML`.
- Include name, type, size, extension, and modified time.
- Optionally include Data URLs for small files.

### Checksum Forge

Supported input: any file.

Functions:

- Generate `SHA-256`, `SHA-384`, or `SHA-512` hashes.
- Export as `TXT`, `CSV`, or `JSON`.

### Text Workshop

Supported input: text-like files.

Functions:

- Clean whitespace.
- Uppercase.
- Lowercase.
- Word count.
- Sort lines.
- Deduplicate lines.
- Export as `TXT`, `JSON`, `CSV`, or `HTML`.

## สรุปภาษาไทย

Gauss คือเว็บแอปจัดการไฟล์แบบครบในที่เดียว เน้นความเป็นส่วนตัวและประมวลผลในเบราว์เซอร์ ผู้ใช้เลือกเครื่องมือ อัปโหลดไฟล์ ปรับตัวเลือก แล้วดาวน์โหลดผลลัพธ์ได้ทันที

เครื่องมือหลัก:

- รูปภาพ: แปลงไฟล์ ปรับขนาด หมุน พลิก และใส่เอฟเฟกต์
- PDF: ตรวจสอบ รวม แยก บีบอัด และดึงหน้า
- แปลงไฟล์: ส่งออกเป็น PDF รูปภาพ TXT JSON CSV Data URL ZIP หรือเก็บต้นฉบับพร้อมเปลี่ยนชื่อ
- ZIP: รวมไฟล์เป็น ZIP พร้อมจัดโฟลเดอร์และแนบ manifest
- งานชุด: เปลี่ยนชื่อ จัดเรียง ติดแท็ก เปลี่ยนตัวพิมพ์ หรือใส่เลขหลายไฟล์พร้อมกัน
- OCR: อ่านข้อความจากรูปภาพด้วย Tesseract.js
- ข้อมูลไฟล์: สร้างรายงานชื่อไฟล์ ประเภท ขนาด และเวลาแก้ไข
- แฮช: สร้าง checksum สำหรับตรวจสอบไฟล์หรือเช็กไฟล์ซ้ำ
- ข้อความ: ล้างช่องว่าง เปลี่ยนตัวพิมพ์ นับคำ เรียงบรรทัด และลบบรรทัดซ้ำ

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- JSZip
- pdf-lib
- Tesseract.js

## Project Structure

```text
src/app/                  App Router pages and layout
src/components/layout/    Top navigation
src/components/tools/     All-in-one workspace and tool UI
src/components/settings/  Local settings UI
src/lib/i18n.tsx          English/Thai language provider
src/lib/tools/registry.ts Tool definitions and settings schemas
src/lib/tools/processors.ts Browser-side file processors
```

## Development

Install dependencies:

```bash
npm install
```

Run development mode:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build production output:

```bash
npm run build
```

Run the production build locally:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## Routes

- `/` - Landing page
- `/tools` - All-in-one workspace
- `/tools/image` - Image Lab
- `/tools/pdf` - PDF Desk
- `/tools/converter` - Format Converter
- `/tools/archive` - Archive Bench
- `/tools/batch` - Batch Console
- `/tools/ocr` - OCR Station
- `/tools/metadata` - Metadata Inspector
- `/tools/checksum` - Checksum Forge
- `/tools/text` - Text Workshop
- `/settings` - Local workspace settings

## Privacy Model

Gauss is designed as a browser-first utility. Selected files are processed in the browser for the implemented tools. The app does not require accounts, cloud upload, or a backend processing server.

## Current Limitations

- Browser APIs cannot perform every possible file conversion. Unsupported binary conversions are represented honestly as metadata label outputs.
- AVIF encoding depends on browser support and may fall back to PNG.
- OCR can be slow on large images and needs Tesseract language data on first use.
- PDF compression is a browser-side re-save/optimization pass, not a full commercial PDF optimizer.

## Deployment

The repository root is a Vercel-ready Next.js app. Import the repository in Vercel with:

- Framework Preset: `Next.js`
- Root Directory: repository root
- Install Command: `npm ci`
- Build Command: `npm run build`

The included `vercel.json` pins those build settings for Vercel deployments. Build locally with:

```bash
npm run build
```
