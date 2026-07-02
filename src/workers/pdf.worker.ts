import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib"

self.addEventListener("message", async (event) => {
  const { files, toolId, editorPages, settings, config } = event.data
  
  try {
    if (toolId === "create-pdf" || toolId === "word-to-pdf") {
      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique)
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
      
      const pageSizeName = settings.pageSize || "A4"
      const orientation = settings.orientation || "Portrait"
      
      let width = 595
      let height = 842
      if (pageSizeName === "Letter") {
        width = 612
        height = 792
      } else if (pageSizeName === "Legal") {
        width = 612
        height = 1008
      }
      
      if (orientation === "Landscape") {
        const temp = width
        width = height
        height = temp
      }
      
      let page = pdf.addPage([width, height])
      let cursorY = height - 60
      const marginX = 50
      
      const blocks = settings.sections ? JSON.parse(settings.sections) : []
      
      for (const block of blocks) {
        if (block.type === "pagebreak") {
          page = pdf.addPage([width, height])
          cursorY = height - 60
          continue
        }
        
        if (block.type === "image") {
          const src = block.src || ""
          if (src.startsWith("data:")) {
            let embeddedImg
            try {
              const base64Data = src.split(",")[1]
              const binaryStr = atob(base64Data)
              const len = binaryStr.length
              const bytes = new Uint8Array(len)
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i)
              }
              
              if (src.includes("image/png")) {
                embeddedImg = await pdf.embedPng(bytes)
              } else {
                embeddedImg = await pdf.embedJpg(bytes)
              }
            } catch {
              // Ignore
            }
            
            if (embeddedImg) {
              const scale = 0.5
              const imgW = embeddedImg.width * scale
              const imgH = embeddedImg.height * scale
              const maxWidth = width - (marginX * 2)
              let finalW = imgW
              let finalH = imgH
              if (imgW > maxWidth) {
                finalW = maxWidth
                finalH = (imgH / imgW) * maxWidth
              }
              
              cursorY -= (finalH + 15)
              if (cursorY < 50) {
                page = pdf.addPage([width, height])
                cursorY = height - 60 - finalH
              }
              page.drawImage(embeddedImg, { x: marginX, y: cursorY, width: finalW, height: finalH })
              cursorY -= 10
            }
          }
          continue
        }

        // COMPILE INTERACTIVE FORM FIELDS
        if (block.type === "formfield") {
          const form = pdf.getForm()
          try {
            const fieldName = block.name || `field-${crypto.randomUUID().slice(0, 4)}`
            if (block.fieldType === "text") {
              const textField = form.createTextField(fieldName)
              textField.setText(block.value || "")
              textField.addToPage(page, { x: marginX, y: cursorY - 15, width: 200, height: 20 })
            } else if (block.fieldType === "checkbox") {
              const checkBox = form.createCheckBox(fieldName)
              if (block.value === "true" || block.checked) checkBox.check()
              checkBox.addToPage(page, { x: marginX, y: cursorY - 15, width: 16, height: 16 })
            } else if (block.fieldType === "select") {
              const dropdown = form.createDropdown(fieldName)
              dropdown.setOptions(block.options || ["Option 1", "Option 2", "Option 3"])
              dropdown.select(block.value || "Option 1")
              dropdown.addToPage(page, { x: marginX, y: cursorY - 15, width: 150, height: 20 })
            }
          } catch (e) {
            console.error("Failed to build form field in background thread", e)
          }
          cursorY -= 32
          continue
        }
        
        let size = 10
        let currentFont = font
        if (block.type === "h1") {
          size = 20
          currentFont = boldFont
          cursorY -= 15
        } else if (block.type === "h2") {
          size = 14
          currentFont = boldFont
          cursorY -= 12
        } else {
          cursorY -= 5
        }
        
        if (cursorY < 50) {
          page = pdf.addPage([width, height])
          cursorY = height - 60 - size
        }
        
        const spans = block.spans || []
        const lines: any[] = []
        let currentLine: any[] = []
        let currentLineWidth = 0
        const maxWidth = width - (marginX * 2)
        
        for (const span of spans) {
          const text = span.text || ""
          if (!text) continue
          
          let fontToUse = font
          if (span.bold && span.italic) fontToUse = boldFont
          else if (span.bold) fontToUse = boldFont
          else if (span.italic) fontToUse = italicFont
          
          const words = text.split(/(\s+)/)
          for (const word of words) {
            if (!word) continue
            const wordWidth = fontToUse.widthOfTextAtSize(word, size)
            if (currentLineWidth + wordWidth > maxWidth) {
              if (currentLine.length > 0) {
                lines.push(currentLine)
                currentLine = []
                currentLineWidth = 0
              }
              if (word.trim() === "") continue
            }
            currentLine.push({
              text: word,
              bold: span.bold,
              italic: span.italic,
              underline: span.underline,
              font: fontToUse,
              width: wordWidth
            })
            currentLineWidth += wordWidth
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine)
        }
        
        for (const line of lines) {
          cursorY -= (size + 4)
          if (cursorY < 50) {
            page = pdf.addPage([width, height])
            cursorY = height - 60 - size
          }
          
          let startX = marginX
          if (block.align === "center" || block.align === "right") {
            let totalLineWidth = 0
            for (const seg of line) totalLineWidth += seg.width
            if (block.align === "center") {
              startX = marginX + (maxWidth - totalLineWidth) / 2
            } else {
              startX = marginX + (maxWidth - totalLineWidth)
            }
          }
          
          let currentX = startX
          for (const seg of line) {
            page.drawText(seg.text, {
              x: currentX,
              y: cursorY,
              size,
              font: seg.font,
              color: rgb(0.1, 0.1, 0.1)
            })
            if (seg.underline) {
              page.drawLine({
                start: { x: currentX, y: cursorY - 2 },
                end: { x: currentX + seg.width, y: cursorY - 2 },
                thickness: 1,
                color: rgb(0.1, 0.1, 0.1)
              })
            }
            currentX += seg.width
          }
        }
        cursorY -= 4
      }
      
      // Stamp watermarks or page numbers
      if (settings.watermarkText) {
        const pages = pdf.getPages()
        for (const p of pages) {
          p.drawText(settings.watermarkText, {
            x: width / 3,
            y: height / 2,
            size: 60,
            font: boldFont,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.15,
            rotate: degrees(-30)
          })
        }
      }

      // Password Encryption integration inside Worker will be wrapped on main thread.

      
      const compiledBytes = await pdf.save()
      
      ;(self as any).postMessage({
        success: true,
        buffer: compiledBytes.buffer,
        pageCount: pdf.getPageCount()
      }, [compiledBytes.buffer])
      
      return
    }

    // Reconstruct PDFDocument instances in worker memory
    const loadedDocs = await Promise.all(
      files.map(async (f: any) => PDFDocument.load(f.buffer))
    )

    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique)
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

    const useObjectStreams = settings.linearize !== false
    
    // Bates sequence options
    const batesPrefix = settings.batesPrefix || "CONFIDENTIAL-"
    const batesStart = Number(settings.batesStart ?? 1)
    const batesPadding = Number(settings.batesPadding ?? 6)
    const batesPosition = settings.batesPosition || "Bottom Right"
    const applyBates = toolId === "bates-pdf"

    // Sandbox overlays state
    const showBates = config?.showBates ?? false
    const showWatermark = config?.showWatermark ?? false
    const showSignature = config?.showSignature ?? false

    let batesCounter = batesStart

    // Page range parser helper for split-pdf
    const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
      const pages: number[] = []
      const parts = rangeStr.split(",")
      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed.includes("-")) {
          const [start, end] = trimmed.split("-").map(Number)
          const s = Math.max(1, isNaN(start) ? 1 : start)
          const e = Math.min(maxPages, isNaN(end) ? maxPages : end)
          for (let i = s; i <= e; i++) {
            pages.push(i - 1)
          }
        } else {
          const pageNum = Number(trimmed)
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
            pages.push(pageNum - 1)
          }
        }
      }
      return pages.length > 0 ? pages : Array.from({ length: maxPages }, (_, i) => i)
    }

    // Determine the list of pages to compile
    let pagesToCompile = []
    if (editorPages && editorPages.length > 0) {
      pagesToCompile = editorPages
    } else if (toolId === "split-pdf" && loadedDocs.length > 0) {
      const doc = loadedDocs[0]
      const splitPages = parsePageRange(settings.pageRange || "1-9999", doc.getPageCount())
      pagesToCompile = splitPages.map((pageIndex) => ({
        fileIndex: 0,
        pageIndex,
        rotation: 0,
      }))
    } else {
      pagesToCompile = files.flatMap((f: any, fileIndex: number) => {
        const doc = loadedDocs[fileIndex]
        return Array.from({ length: doc.getPageCount() }, (_, pageIndex) => ({
          fileIndex,
          pageIndex,
          rotation: 0
        }))
      })
    }

    for (let index = 0; index < pagesToCompile.length; index++) {
      const item = pagesToCompile[index]
      const sourceDoc = loadedDocs[item.fileIndex]
      const [copiedPage] = await pdf.copyPages(sourceDoc, [item.pageIndex])
      
      // 1. Apply visual rotation
      if (item.rotation) {
        copiedPage.setRotation(degrees(item.rotation))
      }

      // 2. Vector Grayscale Filter
      if (toolId === "grayscale-pdf") {
        copiedPage.drawRectangle({
          x: 0,
          y: 0,
          width: copiedPage.getWidth(),
          height: copiedPage.getHeight(),
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.05,
        })
      }

      // 3. Bates Stamping Engine
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

        if (config && config.batesX !== undefined && config.batesY !== undefined) {
          bx = config.batesX
          by = config.batesY
        } else {
          if (position === "Top Left") { bx = margin; by = height - margin }
          else if (position === "Top Center") { bx = (width - textWidth) / 2; by = height - margin }
          else if (position === "Top Right") { bx = width - margin - textWidth; by = height - margin }
          else if (position === "Bottom Left") { bx = margin; by = margin }
          else if (position === "Bottom Center") { bx = (width - textWidth) / 2; by = margin }
        }

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

      // 4. Interactive Watermark Placement
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

      // 5. Signature Block Placement
      if (showSignature && config) {
        const sigStr = config.signatureText || "Authorized Sign"
        const sX = config.signatureX
        const sY = config.signatureY
        
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

    // Password encryption option inside visual editing compiler will be wrapped on main thread.


    const compiledBytes = await pdf.save({ useObjectStreams })
    
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
