import JSZip from "jszip";

interface DocxExportOptions {
  pageSize?: "A4" | "Letter" | "Legal";
  orientation?: "Portrait" | "Landscape";
  margins?: "normal" | "narrow" | "wide" | { top: number; bottom: number; left: number; right: number };
  watermarkText?: string;
  headerText?: string;
  footerText?: string;
}

export async function exportToDocx(html: string, options: DocxExportOptions = {}): Promise<Blob> {
  const zip = new JSZip();
  const hyperlinks: { id: string; target: string }[] = [];
  const images: { id: string; ext: string; base64: string }[] = [];

  // Build body content XML and collect hyperlinks/images dynamically
  const documentXml = buildDocumentXml(html, options, hyperlinks, images);
  zip.file("word/document.xml", documentXml);

  // 1. [Content_Types].xml (including overrides for all image formats collected)
  const imageExtensions = new Set<string>();
  images.forEach(img => imageExtensions.add(img.ext));

  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>`;

  imageExtensions.forEach(ext => {
    const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    contentTypesXml += `\n  <Default Extension="${ext}" ContentType="${mime}"/>`;
  });

  contentTypesXml += `
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;
  zip.file("[Content_Types].xml", contentTypesXml);

  // 2. _rels/.rels
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // 3. word/_rels/document.xml.rels
  let relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdFtr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>`;

  hyperlinks.forEach(hl => {
    const escapedTarget = hl.target
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
    relsXml += `\n  <Relationship Id="${hl.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapedTarget}" TargetMode="External"/>`;
  });

  images.forEach(img => {
    relsXml += `\n  <Relationship Id="${img.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image_${img.id}.${img.ext}"/>`;
  });

  relsXml += `\n</Relationships>`;
  zip.file("word/_rels/document.xml.rels", relsXml);

  // 4. word/styles.xml
  zip.file("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`);

  // 5. word/header1.xml (Page Header)
  const headerContent = options.headerText || "Gauss Document Studio Workspace";
  zip.file("word/header1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="right"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:sz w:val="18"/>
        <w:color w:val="71717A"/>
      </w:rPr>
      <w:t>${headerContent.toUpperCase()}</w:t>
    </w:r>
  </w:p>
</w:hdr>`);

  // 6. word/footer1.xml (Page Footer)
  const footerContent = options.footerText || "Confidential - Local-First Offline";
  zip.file("word/footer1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:sz w:val="18"/>
        <w:color w:val="71717A"/>
      </w:rPr>
      <w:t>${footerContent}</w:t>
    </w:r>
  </w:p>
</w:hdr>`);

  // 7. Write images to word/media/
  images.forEach(img => {
    zip.file(`word/media/image_${img.id}.${img.ext}`, img.base64, { base64: true });
  });

  return await zip.generateAsync({ type: "blob" });
}

function buildDocumentXml(
  html: string,
  options: DocxExportOptions,
  hyperlinks: { id: string; target: string }[],
  images: { id: string; ext: string; base64: string }[]
): string {
  // Parse dimensions in twentieths of a point (dxa)
  // 1 pt = 20 dxa
  let width = 11906;  // A4 Width (595.27pt)
  let height = 16838; // A4 Height (841.89pt)

  if (options.pageSize === "Letter") {
    width = 12240;  // 612pt
    height = 15840; // 792pt
  } else if (options.pageSize === "Legal") {
    width = 12240;  // 612pt
    height = 20160; // 1008pt
  }

  // Switch if Landscape
  if (options.orientation === "Landscape") {
    const temp = width;
    width = height;
    height = temp;
  }

  let topMar = 1440; // 1 inch
  let bottomMar = 1440;
  let leftMar = 1440;
  let rightMar = 1440;

  if (options.margins === "narrow") {
    topMar = 720;
    bottomMar = 720;
    leftMar = 720;
    rightMar = 720;
  } else if (options.margins === "wide") {
    topMar = 2880;
    bottomMar = 2880;
    leftMar = 2880;
    rightMar = 2880;
  } else if (typeof options.margins === "object") {
    topMar = options.margins.top * 20;
    bottomMar = options.margins.bottom * 20;
    leftMar = options.margins.left * 20;
    rightMar = options.margins.right * 20;
  }

  const orientationVal = options.orientation === "Landscape" ? "landscape" : "portrait";

  // Parse HTML DOM structures in browser env
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  let bodyXml = "";

  function getAlignment(el: HTMLElement): string {
    const align = el.style.textAlign || el.getAttribute("align") || "";
    if (align === "center") return "center";
    if (align === "right") return "right";
    if (align === "justify") return "both";
    return "left";
  }

  function getRunProps(el: HTMLElement): string {
    let rPr = "";
    const parentTag = el.tagName.toLowerCase();
    
    const isBold = parentTag === "strong" || parentTag === "b" || el.style.fontWeight === "bold" || el.style.fontWeight === "700";
    const isItalic = parentTag === "em" || parentTag === "i" || el.style.fontStyle === "italic";
    const isUnderline = parentTag === "u" || el.style.textDecoration === "underline";
    const isStrike = parentTag === "strike" || parentTag === "s" || el.style.textDecoration === "line-through";
    const isSup = parentTag === "sup";
    const isSub = parentTag === "sub";

    if (isBold) rPr += "<w:b/>";
    if (isItalic) rPr += "<w:i/>";
    if (isUnderline) rPr += '<w:u w:val="single"/>';
    if (isStrike) rPr += '<w:strike w:val="single"/>';
    
    if (isSup) rPr += '<w:vertAlign w:val="superscript"/>';
    if (isSub) rPr += '<w:vertAlign w:val="subscript"/>';

    // Parse Font Face
    const fontFamily = el.style.fontFamily || "";
    if (fontFamily) {
      const cleanFont = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      rPr += `<w:rFonts w:ascii="${cleanFont}" w:hAnsi="${cleanFont}"/>`;
    }

    // Parse Font Size
    const fontSize = el.style.fontSize || "";
    if (fontSize) {
      let sizePt = parseFloat(fontSize);
      if (fontSize.includes("pt")) {
        sizePt = parseFloat(fontSize);
      } else if (fontSize.includes("px")) {
        sizePt = Math.round(parseFloat(fontSize) * 0.75);
      }
      if (sizePt) {
        rPr += `<w:sz w:val="${Math.round(sizePt * 2)}"/>`;
      }
    }

    // Parse Color (Hex)
    const color = el.style.color || "";
    if (color) {
      const hexMatch = color.match(/#([a-fA-F0-9]{6})/);
      if (hexMatch) {
        rPr += `<w:color w:val="${hexMatch[1].toUpperCase()}"/>`;
      }
    }

    // Parse Highlight Color
    const bg = el.style.backgroundColor || "";
    if (bg) {
      const hexMatch = bg.match(/#([a-fA-F0-9]{6})/);
      if (hexMatch) {
        rPr += `<w:shd w:fill="${hexMatch[1].toUpperCase()}"/>`;
      }
    }

    return rPr;
  }

  function parseTextRun(node: Node, parentStyle = ""): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (!text.trim() && text !== " ") return "";
      // Escape XML characters
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `<w:r>${parentStyle ? `<w:rPr>${parentStyle}</w:rPr>` : ""}<w:t xml:space="preserve">${escapedText}</w:t></w:r>`;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const currentStyle = getRunProps(el);
    const combinedStyle = parentStyle + currentStyle;

    let runXml = "";
    
    // Check for nested nodes
    for (let i = 0; i < el.childNodes.length; i++) {
      runXml += parseTextRun(el.childNodes[i], combinedStyle);
    }
    
    return runXml;
  }

  function parseParagraph(el: HTMLElement, listInfo?: { type: "ul" | "ol"; index: number }): string {
    const align = getAlignment(el);
    const alignmentXml = align !== "left" ? `<w:jc w:val="${align}"/>` : "";
    
    let runPropsXml = "";
    const tagName = el.tagName.toLowerCase();

    // Map headings
    if (tagName === "h1") {
      runPropsXml = "<w:b/><w:sz w:val=\"48\"/><w:color w:val=\"22D3EE\"/>";
    } else if (tagName === "h2") {
      runPropsXml = "<w:b/><w:sz w:val=\"36\"/><w:color w:val=\"22D3EE\"/>";
    } else if (tagName === "h3") {
      runPropsXml = "<w:b/><w:sz w:val=\"28\"/><w:color w:val=\"FBBF24\"/>";
    }

    let indentXml = "";
    if (listInfo) {
      // Calculate depth by counting ancestor list elements (ul/ol)
      let depth = 0;
      let parent = el.parentElement;
      while (parent) {
        const tag = parent.tagName.toLowerCase();
        if (tag === "ul" || tag === "ol") {
          depth++;
        }
        parent = parent.parentElement;
      }
      const leftIndent = depth * 360 + 360;
      indentXml = `<w:ind w:left="${leftIndent}" w:hanging="360"/>`;
    }

    let listBulletXml = "";
    if (listInfo) {
      if (listInfo.type === "ul") {
        listBulletXml = `<w:r><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr><w:t>· </w:t></w:r>`;
      } else {
        listBulletXml = `<w:r><w:rPr><w:b/></w:rPr><w:t>${listInfo.index}. </w:t></w:r>`;
      }
    }

    let runsXml = "";
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      const childTag = child.nodeType === Node.ELEMENT_NODE ? (child as HTMLElement).tagName.toLowerCase() : "";

      if (childTag === "a") {
        const aEl = child as HTMLElement;
        const href = aEl.getAttribute("href") || "#";
        const hlId = `rIdLink${hyperlinks.length + 1}`;
        hyperlinks.push({ id: hlId, target: href });
        
        const aStyle = getRunProps(aEl);
        let innerRuns = "";
        for (let j = 0; j < aEl.childNodes.length; j++) {
          innerRuns += parseTextRun(aEl.childNodes[j], runPropsXml + aStyle);
        }
        runsXml += `<w:hyperlink r:id="${hlId}">${innerRuns}</w:hyperlink>`;
      } else if (childTag === "img") {
        const imgEl = child as HTMLImageElement;
        const src = imgEl.src || imgEl.getAttribute("src") || "";
        
        if (src.startsWith("data:image/")) {
          const mimeMatch = src.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            const base64Data = mimeMatch[2];
            const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
            const imgId = `rIdImg${images.length + 1}`;
            images.push({ id: imgId, ext, base64: base64Data });
            
            let widthPx = 300;
            let heightPx = 200;
            const styleWidth = imgEl.style.width || imgEl.getAttribute("width") || "";
            const styleHeight = imgEl.style.height || imgEl.getAttribute("height") || "";
            if (styleWidth) widthPx = parseFloat(styleWidth) || 300;
            if (styleHeight) heightPx = parseFloat(styleHeight) || 200;
            
            const cx = Math.round(widthPx * 9525);
            const cy = Math.round(heightPx * 9525);
            const drawingId = images.length;
            
            runsXml += `<w:r><w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="${cx}" cy="${cy}"/>
                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                <wp:docPr id="${drawingId}" name="Image ${drawingId}"/>
                <wp:cNvGraphicFramePr>
                  <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                </wp:cNvGraphicFramePr>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr>
                        <pic:cNvPr id="${drawingId}" name="Image ${drawingId}"/>
                        <pic:cNvPicPr/>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="${imgId}"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm>
                          <a:off x="0" y="0"/>
                          <a:ext cx="${cx}" cy="${cy}"/>
                        </a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing></w:r>`;
          }
        }
      } else {
        runsXml += parseTextRun(child, runPropsXml);
      }
    }

    return `<w:p>
      <w:pPr>
        ${alignmentXml}
        ${indentXml}
      </w:pPr>
      ${listBulletXml}
      ${runsXml}
    </w:p>`;
  }

  function parseTable(tableEl: HTMLElement): string {
    let tblXml = `<w:tbl>
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="3F3F46"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="3F3F46"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="3F3F46"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="3F3F46"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="27272A"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="27272A"/>
        </w:tblBorders>
      </w:tblPr>`;

    const rows: HTMLElement[] = [];
    function collectRows(node: HTMLElement) {
      Array.from(node.children).forEach(child => {
        const tag = child.tagName.toLowerCase();
        if (tag === "tr") {
          rows.push(child as HTMLElement);
        } else if (tag === "tbody" || tag === "thead" || tag === "tfoot") {
          collectRows(child as HTMLElement);
        }
      });
    }
    collectRows(tableEl);

    rows.forEach(row => {
      tblXml += "<w:tr>";
      const cells = Array.from(row.children).filter(c => {
        const tag = c.tagName.toLowerCase();
        return tag === "td" || tag === "th";
      }) as HTMLElement[];

      cells.forEach(cell => {
        const cellEl = cell as HTMLElement;
        const bg = cellEl.style.backgroundColor || "";
        let shdXml = "";
        
        if (bg) {
          const hexMatch = bg.match(/#([a-fA-F0-9]{6})/);
          if (hexMatch) {
            shdXml = `<w:shd w:fill="${hexMatch[1].toUpperCase()}"/>`;
          }
        }

        tblXml += `<w:tc>
          <w:tcPr>
            ${shdXml}
          </w:tcPr>`;
        
        // Parse paragraphs inside table cell
        if (cellEl.children.length === 0) {
          const align = cellEl.style.textAlign || "";
          const alignXml = align ? `<w:jc w:val="${align}"/>` : "";
          const text = cellEl.textContent || "";
          const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          tblXml += `<w:p><w:pPr>${alignXml}</w:pPr><w:r><w:t>${escaped}</w:t></w:r></p>`;
        } else {
          Array.from(cellEl.children).forEach(child => {
            tblXml += parseParagraph(child as HTMLElement);
          });
        }

        tblXml += "</w:tc>";
      });
      tblXml += "</w:tr>";
    });

    tblXml += "</w:tbl>";
    return tblXml;
  }

  function parseList(listEl: HTMLElement, type: "ul" | "ol"): string {
    let listXml = "";
    const items = Array.from(listEl.children).filter(c => c.tagName.toLowerCase() === "li");
    items.forEach((item, index) => {
      listXml += parseParagraph(item as HTMLElement, { type, index: index + 1 });
    });
    return listXml;
  }

  // Walk structural blocks, grouping consecutive root inline nodes into virtual paragraphs
  let currentInlineNodes: Node[] = [];
  
  function flushPendingParagraph() {
    if (currentInlineNodes.length === 0) return;
    const virtualP = document.createElement("p");
    currentInlineNodes.forEach(n => virtualP.appendChild(n.cloneNode(true)));
    bodyXml += parseParagraph(virtualP);
    currentInlineNodes = [];
  }

  for (let i = 0; i < body.childNodes.length; i++) {
    const node = body.childNodes[i];
    let isBlock = false;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      isBlock = ["p", "div", "h1", "h2", "h3", "table", "ul", "ol", "hr"].includes(tag);
    }

    if (isBlock) {
      flushPendingParagraph();
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "table") {
        bodyXml += parseTable(el);
      } else if (tag === "ul") {
        bodyXml += parseList(el, "ul");
      } else if (tag === "ol") {
        bodyXml += parseList(el, "ol");
      } else if (tag === "hr") {
        // Page break in Word
        bodyXml += `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>`;
      } else {
        bodyXml += parseParagraph(el);
      }
    } else {
      currentInlineNodes.push(node);
    }
  }

  flushPendingParagraph();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/wordprocessingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
>
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rIdHdr"/>
      <w:footerReference w:type="default" r:id="rIdFtr"/>
      <w:pgSz w:w="${width}" w:h="${height}" w:orient="${orientationVal}"/>
      <w:pgMar w:top="${topMar}" w:right="${rightMar}" w:bottom="${bottomMar}" w:left="${leftMar}" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}
