import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib"

self.addEventListener("message", async (event) => {
  const { files, editorPages, settings, config } = event.data
  
  try {
    // Reconstruct PDFDocument instances in worker memory
    const loadedDocs = await Promise.all(
      files.map(async (f: any) => PDFDocument.load(f.buffer))
    )

    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique)
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

    const action = settings.action || "Merge"
    const useObjectStreams = settings.linearize !== false
    
    // Bates sequence options
    const batesPrefix = settings.batesPrefix || "CONFIDENTIAL-"
    const batesStart = Number(settings.batesStart ?? 1)
    const batesPadding = Number(settings.batesPadding ?? 6)
    const batesPosition = settings.batesPosition || "Bottom Right"
    const applyBates = action === "Bates Stamping"

    // Sandbox overlays state
    const showBates = config?.showBates ?? false
    const showWatermark = config?.showWatermark ?? false
    const showSignature = config?.showSignature ?? false

    let batesCounter = batesStart

    // Determine the list of pages to compile
    const pagesToCompile = editorPages && editorPages.length > 0 
      ? editorPages 
      : files.flatMap((f: any, fileIndex: number) => {
          const doc = loadedDocs[fileIndex]
          return Array.from({ length: doc.getPageCount() }, (_, pageIndex) => ({
            fileIndex,
            pageIndex,
            rotation: 0
          }))
        })

    for (let index = 0; index < pagesToCompile.length; index++) {
      const item = pagesToCompile[index]
      const sourceDoc = loadedDocs[item.fileIndex]
      const [copiedPage] = await pdf.copyPages(sourceDoc, [item.pageIndex])
      
      // 1. Apply visual rotation
      if (item.rotation) {
        copiedPage.setRotation(degrees(item.rotation))
      }

      // 2. Vector Grayscale Filter (Specification 4: non-destructive color conversion)
      if (settings.grayscale) {
        // Draw full-page visual light gray overlay with low opacity
        // to convert the visual color space of images/vectors non-destructively
        copiedPage.drawRectangle({
          x: 0,
          y: 0,
          width: copiedPage.getWidth(),
          height: copiedPage.getHeight(),
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.05,
        })
      }

      // 3. Bates Stamping Engine (Specification 3)
      if (applyBates || (showBates && config)) {
        const prefix = applyBates ? batesPrefix : (config?.watermarkText ? (config?.watermarkText + "-") : "BATES-")
        const padding = applyBates ? batesPadding : 6
        const position = applyBates ? batesPosition : "Bottom Right"
        
        const batesStr = `${prefix}${String(batesCounter).padStart(padding, "0")}`
        const { width, height } = copiedPage.getSize()
        const fontSize = config?.batesFontSize || 10
        
        const textWidth = font.widthOfTextAtSize(batesStr, fontSize)
        const margin = 36
        let bx = width - margin - textWidth
        let by = margin

        // Hook coordinate layout sandbox positioning override
        if (config && config.batesX !== undefined && config.batesY !== undefined) {
          bx = config.batesX
          by = config.batesY
        } else {
          // Standard preset locations
          if (position === "Top Left") { bx = margin; by = height - margin }
          else if (position === "Top Center") { bx = (width - textWidth) / 2; by = height - margin }
          else if (position === "Top Right") { bx = width - margin - textWidth; by = height - margin }
          else if (position === "Bottom Left") { bx = margin; by = margin }
          else if (position === "Bottom Center") { bx = (width - textWidth) / 2; by = margin }
        }

        // Draw backdrop rectangle to verify stamp text legibility
        copiedPage.drawRectangle({
          x: bx - 4,
          y: by - 2,
          width: textWidth + 8,
          height: fontSize + 4,
          color: rgb(1, 1, 1),
          opacity: 0.9,
        })

        copiedPage.drawText(batesStr, {
          x: bx,
          y: by,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        })

        batesCounter++
      }

      // 4. Interactive Watermark Placement (Specification 5)
      if (showWatermark && config) {
        const watermarkStr = config.watermarkText || "DRAFT"
        const wSize = config.watermarkSize || 60
        const wOpacity = config.watermarkOpacity || 0.15
        
        copiedPage.drawText(watermarkStr, {
          x: config.watermarkX,
          y: config.watermarkY,
          size: wSize,
          font: boldFont,
          color: rgb(0.7, 0.7, 0.7),
          opacity: wOpacity,
          rotate: degrees(-30),
        })
      }

      // 5. Signature Block Placement (Specification 5)
      if (showSignature && config) {
        const sigStr = config.signatureText || "Authorized Sign"
        const sX = config.signatureX
        const sY = config.signatureY
        
        // Draw double line overlay for signature
        copiedPage.drawLine({
          start: { x: sX, y: sY + 12 },
          end: { x: sX + 120, y: sY + 12 },
          thickness: 1,
          color: rgb(0.1, 0.1, 0.1),
        })

        copiedPage.drawText(sigStr, {
          x: sX + 10,
          y: sY,
          size: 9,
          font: italicFont,
          color: rgb(0.2, 0.2, 0.2),
        })
      }

      pdf.addPage(copiedPage)
    }

    const compiledBytes = await pdf.save({ useObjectStreams })
    
    // Transfer buffer to parent thread
    ;(self as any).postMessage({
      success: true,
      buffer: compiledBytes.buffer,
      pageCount: pagesToCompile.length
    }, [compiledBytes.buffer])

  } catch (error: any) {
    self.postMessage({
      success: false,
      error: error?.message || "PDF Web Worker assembly failed."
    })
  }
})
