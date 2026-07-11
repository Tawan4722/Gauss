import JSZip from "jszip";

export async function importFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) {
    throw new Error("Invalid DOCX file structure. 'word/document.xml' not found.");
  }
  
  const xmlText = await documentXmlFile.async("string");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const bodyNode = xmlDoc.getElementsByTagNameNS("*", "body")[0] || xmlDoc.getElementsByTagName("w:body")[0];
  
  if (!bodyNode) {
    throw new Error("Empty document body parsed.");
  }

  // 1. Parse word/_rels/document.xml.rels to map relationships (for hyperlinks and images)
  const relsMap: Record<string, string> = {};
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (relsFile) {
    const relsText = await relsFile.async("string");
    const relsDoc = parser.parseFromString(relsText, "text/xml");
    const relNodes = relsDoc.getElementsByTagNameNS("*", "Relationship");
    for (let i = 0; i < relNodes.length; i++) {
      const id = relNodes[i].getAttribute("Id") || "";
      const target = relNodes[i].getAttribute("Target") || "";
      if (id && target) {
        relsMap[id] = target;
      }
    }
  }

  // 2. Parse word/numbering.xml to map list types (ul vs ol)
  const numIdMap: Record<string, "ul" | "ol"> = {};
  const numberingFile = zip.file("word/numbering.xml");
  if (numberingFile) {
    const numText = await numberingFile.async("string");
    const numDoc = parser.parseFromString(numText, "text/xml");
    
    // abstractNumId -> type
    const abstractMap: Record<string, "ul" | "ol"> = {};
    const abstractNodes = numDoc.getElementsByTagNameNS("*", "abstractNum");
    for (let i = 0; i < abstractNodes.length; i++) {
      const node = abstractNodes[i];
      const absId = node.getAttribute("w:abstractNumId") || node.getAttribute("abstractNumId") || "";
      
      const lvlNodes = node.getElementsByTagNameNS("*", "lvl");
      let type: "ul" | "ol" = "ul";
      if (lvlNodes.length > 0) {
        const numFmt = lvlNodes[0].getElementsByTagNameNS("*", "numFmt")[0];
        if (numFmt) {
          const fmtVal = numFmt.getAttribute("w:val") || numFmt.getAttribute("val") || "";
          if (fmtVal !== "bullet" && fmtVal !== "none") {
            type = "ol";
          }
        }
      }
      abstractMap[absId] = type;
    }

    // numId -> type
    const numNodes = numDoc.getElementsByTagNameNS("*", "num");
    for (let i = 0; i < numNodes.length; i++) {
      const node = numNodes[i];
      const numId = node.getAttribute("w:numId") || node.getAttribute("numId") || "";
      const absNode = node.getElementsByTagNameNS("*", "abstractNumId")[0];
      if (absNode) {
        const absId = absNode.getAttribute("w:val") || absNode.getAttribute("val") || "";
        numIdMap[numId] = abstractMap[absId] || "ul";
      }
    }
  }
  
  let html = "";

  async function parseRun(runNode: Element): Promise<string> {
    let text = "";
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isStrike = false;
    let isSup = false;
    let isSub = false;
    let color = "";
    let bgColor = "";
    let fontSize = "";
    let fontFamily = "";

    // Check for images / drawings first
    const drawingNodes = runNode.getElementsByTagNameNS("*", "drawing");
    if (drawingNodes.length > 0) {
      let drawingHtml = "";
      for (let i = 0; i < drawingNodes.length; i++) {
        const blipNodes = drawingNodes[i].getElementsByTagNameNS("*", "blip");
        for (let j = 0; j < blipNodes.length; j++) {
          const embedId = blipNodes[j].getAttribute("r:embed") || blipNodes[j].getAttribute("embed") || "";
          if (embedId && relsMap[embedId]) {
            const mediaPath = relsMap[embedId];
            const fullPath = mediaPath.startsWith("word/") ? mediaPath : `word/${mediaPath}`;
            const imgFile = zip.file(fullPath);
            if (imgFile) {
              const base64Data = await imgFile.async("base64");
              const ext = mediaPath.substring(mediaPath.lastIndexOf(".") + 1).toLowerCase();
              const mime = ext === "jpg" ? "jpeg" : ext;
              
              // Try to parse visual size limits from extent if available
              let widthPx = 300;
              let heightPx = 200;
              const extentNode = drawingNodes[i].getElementsByTagNameNS("*", "extent")[0];
              if (extentNode) {
                const cx = extentNode.getAttribute("cx");
                const cy = extentNode.getAttribute("cy");
                if (cx && cy) {
                  widthPx = Math.round(parseInt(cx) / 9525);
                  heightPx = Math.round(parseInt(cy) / 9525);
                }
              }
              
              drawingHtml += `<img src="data:image/${mime};base64,${base64Data}" style="max-width:100%;width:${widthPx}px;height:${heightPx}px;margin:8px 0;display:block;" />`;
            }
          }
        }
      }
      if (drawingHtml) return drawingHtml;
    }

    // Parse run properties
    const rPrNode = Array.from(runNode.children).find(c => c.localName === "rPr");
    if (rPrNode) {
      for (const prop of Array.from(rPrNode.children)) {
        switch (prop.localName) {
          case "b":
            isBold = true;
            break;
          case "i":
            isItalic = true;
            break;
          case "u":
            isUnderline = true;
            break;
          case "strike":
            isStrike = true;
            break;
          case "vertAlign":
            const alignVal = prop.getAttribute("w:val") || prop.getAttribute("val");
            if (alignVal === "superscript") isSup = true;
            if (alignVal === "subscript") isSub = true;
            break;
          case "color":
            const colVal = prop.getAttribute("w:val") || prop.getAttribute("val");
            if (colVal) color = `#${colVal}`;
            break;
          case "shd":
            const bgVal = prop.getAttribute("w:fill") || prop.getAttribute("fill");
            if (bgVal && bgVal !== "auto") bgColor = `#${bgVal}`;
            break;
          case "sz":
            const szVal = prop.getAttribute("w:val") || prop.getAttribute("val");
            if (szVal) {
              const pt = Math.round(parseInt(szVal) / 2);
              fontSize = `${pt}pt`;
            }
            break;
          case "rFonts":
            const asciiFont = prop.getAttribute("w:ascii") || prop.getAttribute("ascii");
            if (asciiFont) fontFamily = asciiFont;
            break;
        }
      }
    }

    // Extract text values
    const tNodes = Array.from(runNode.children).filter(c => c.localName === "t");
    tNodes.forEach(tNode => {
      text += tNode.textContent || "";
    });

    if (!text && !isStrike) return "";

    // Escape text characters
    let formattedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Wrap styled spans
    let style = "";
    if (color) style += `color:${color};`;
    if (bgColor) style += `background-color:${bgColor};`;
    if (fontSize) style += `font-size:${fontSize};`;
    if (fontFamily) style += `font-family:${fontFamily}, sans-serif;`;

    if (style) {
      formattedText = `<span style="${style}">${formattedText}</span>`;
    }

    if (isBold) formattedText = `<strong>${formattedText}</strong>`;
    if (isItalic) formattedText = `<em>${formattedText}</em>`;
    if (isUnderline) formattedText = `<u>${formattedText}</u>`;
    if (isStrike) formattedText = `<strike>${formattedText}</strike>`;
    if (isSup) formattedText = `<sup>${formattedText}</sup>`;
    if (isSub) formattedText = `<sub>${formattedText}</sub>`;

    return formattedText;
  }

  async function parseParagraph(pNode: Element): Promise<string> {
    const pPrNode = Array.from(pNode.children).find(c => c.localName === "pPr");
    let align = "left";
    let isHeading1 = false;
    let isHeading2 = false;
    let isHeading3 = false;
    let hasPageBreak = false;

    if (pPrNode) {
      for (const prop of Array.from(pPrNode.children)) {
        if (prop.localName === "jc") {
          const jcVal = prop.getAttribute("w:val") || prop.getAttribute("val");
          if (jcVal === "center") align = "center";
          if (jcVal === "right") align = "right";
          if (jcVal === "both") align = "justify";
        }
        if (prop.localName === "pStyle") {
          const styleVal = prop.getAttribute("w:val") || prop.getAttribute("val") || "";
          if (styleVal.toLowerCase().includes("heading1") || styleVal === "1") isHeading1 = true;
          if (styleVal.toLowerCase().includes("heading2") || styleVal === "2") isHeading2 = true;
          if (styleVal.toLowerCase().includes("heading3") || styleVal === "3") isHeading3 = true;
        }
        if (prop.localName === "pageBreakBefore") {
          hasPageBreak = true;
        }
      }
    }

    // Check for page break in runs
    const brNodes = pNode.getElementsByTagNameNS("*", "br");
    for (let i = 0; i < brNodes.length; i++) {
      if (brNodes[i].getAttribute("w:type") === "page" || brNodes[i].getAttribute("type") === "page") {
        hasPageBreak = true;
      }
    }

    // Check if paragraph is list item
    let isList = false;
    let listType: "ul" | "ol" = "ul";
    const numPrNode = pPrNode ? Array.from(pPrNode.children).find(c => c.localName === "numPr") : null;
    if (numPrNode) {
      isList = true;
      const numIdNode = Array.from(numPrNode.children).find(c => c.localName === "numId");
      if (numIdNode) {
        const numId = numIdNode.getAttribute("w:val") || numIdNode.getAttribute("val") || "";
        listType = numIdMap[numId] || "ul";
      }
    }

    // Traverse recursively to handle all child structures in paragraph (hyperlinks, structured elements, normal runs)
    async function traverseParagraph(node: Element): Promise<string> {
      let content = "";
      for (const child of Array.from(node.children)) {
        if (child.localName === "r") {
          content += await parseRun(child);
        } else if (child.localName === "hyperlink") {
          const relId = child.getAttribute("r:id") || child.getAttribute("id") || "";
          const url = relsMap[relId] || "#";
          const innerText = await traverseParagraph(child);
          content += `<a href="${url}" style="color:#22d3ee;text-decoration:underline;">${innerText}</a>`;
        } else if (child.localName !== "pPr") {
          content += await traverseParagraph(child);
        }
      }
      return content;
    }

    const innerContent = await traverseParagraph(pNode);

    if (!innerContent.trim()) {
      if (hasPageBreak) {
        return '<hr style="border:none;height:1px;background-color:#3f3f46;margin:16px 0;"/>';
      }
      return "<p><br></p>";
    }

    let pStyle = `font-family:'Geist Sans', sans-serif;`;
    if (align !== "left") pStyle += `text-align:${align};`;

    let htmlBlock = "";
    if (isHeading1) {
      htmlBlock = `<h1 style="${pStyle}font-size:24pt;font-weight:bold;color:#22d3ee;margin:0 0 16px;">${innerContent}</h1>`;
    } else if (isHeading2) {
      htmlBlock = `<h2 style="${pStyle}font-size:18pt;font-weight:bold;color:#22d3ee;margin:16px 0 8px;">${innerContent}</h2>`;
    } else if (isHeading3) {
      htmlBlock = `<h3 style="${pStyle}font-size:14pt;font-weight:bold;color:#fbbf24;margin:12px 0 6px;">${innerContent}</h3>`;
    } else if (isList) {
      // Return with data-list-type so parent logic can group it correctly as <ul> or <ol>
      htmlBlock = `<li data-list-type="${listType}" style="${pStyle}color:#e4e4e7;margin-bottom:4px;">${innerContent}</li>`;
    } else {
      htmlBlock = `<p style="${pStyle}font-size:11pt;line-height:1.6;color:#e4e4e7;margin-bottom:12px;">${innerContent}</p>`;
    }

    if (hasPageBreak) {
      htmlBlock = `<hr style="border:none;height:1px;background-color:#3f3f46;margin:16px 0;"/>` + htmlBlock;
    }

    return htmlBlock;
  }

  async function parseTable(tblNode: Element): Promise<string> {
    let tblHtml = '<table style="border-collapse:collapse;width:100%;margin:12px 0;border:1px solid #3f3f46">';
    const rows = Array.from(tblNode.children).filter(c => c.localName === "tr");
    
    for (const row of rows) {
      tblHtml += "<tr>";
      const cells = Array.from(row.children).filter(c => c.localName === "tc");
      
      for (const cell of cells) {
        let cellStyle = "border:1px solid #3f3f46;padding:8px 12px;min-width:50px;color:#f4f4f5;";
        const tcPrNode = Array.from(cell.children).find(c => c.localName === "tcPr");
        
        if (tcPrNode) {
          const shdNode = Array.from(tcPrNode.children).find(c => c.localName === "shd");
          if (shdNode) {
            const fillVal = shdNode.getAttribute("w:fill") || shdNode.getAttribute("fill");
            if (fillVal && fillVal !== "auto") {
              cellStyle += `background-color:#${fillVal};`;
            }
          }
        }

        tblHtml += `<td style="${cellStyle}">`;
        
        const paragraphs = Array.from(cell.children).filter(c => c.localName === "p");
        if (paragraphs.length === 0) {
          const align = (cell as HTMLElement).style.textAlign || "";
          const alignStyle = align ? `text-align:${align};` : "";
          const text = cell.textContent || "";
          const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          tblHtml += `<p style="${alignStyle}">${escaped}</p>`;
        } else {
          for (const p of paragraphs) {
            tblHtml += await parseParagraph(p);
          }
        }
        
        tblHtml += "</td>";
      }
      tblHtml += "</tr>";
    }

    tblHtml += "</table>";
    return tblHtml;
  }

  // Iterate top-level children of body
  for (const node of Array.from(bodyNode.children)) {
    if (node.localName === "p") {
      html += await parseParagraph(node);
    } else if (node.localName === "tbl") {
      html += await parseTable(node);
    }
  }

  // Post-process grouping contiguous <li> elements into lists (supporting both ul and ol types)
  const tempContainer = parser.parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild as HTMLElement;
  if (tempContainer) {
    let finalHtml = "";
    let activeListHtml = "";
    let inList = false;
    let currentListType: "ul" | "ol" = "ul";

    Array.from(tempContainer.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === "li") {
        const itemType = ((node as HTMLElement).getAttribute("data-list-type") as "ul" | "ol") || "ul";
        
        if (inList && currentListType !== itemType) {
          activeListHtml += currentListType === "ul" ? "</ul>" : "</ol>";
          finalHtml += activeListHtml;
          activeListHtml = "";
          inList = false;
        }

        if (!inList) {
          currentListType = itemType;
          activeListHtml = currentListType === "ul"
            ? '<ul style="list-style-type:disc;padding-left:24px;margin-bottom:12px;">'
            : '<ol style="list-style-type:decimal;padding-left:24px;margin-bottom:12px;">';
          inList = true;
        }

        (node as HTMLElement).removeAttribute("data-list-type");
        activeListHtml += (node as HTMLElement).outerHTML;
      } else {
        if (inList) {
          activeListHtml += currentListType === "ul" ? "</ul>" : "</ol>";
          finalHtml += activeListHtml;
          activeListHtml = "";
          inList = false;
        }
        finalHtml += node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement).outerHTML : node.textContent || "";
      }
    });

    if (inList) {
      activeListHtml += currentListType === "ul" ? "</ul>" : "</ol>";
      finalHtml += activeListHtml;
    }
    
    return finalHtml;
  }

  return html;
}
