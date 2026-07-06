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
  
  let html = "";

  function parseRun(runNode: Element): string {
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

  function parseParagraph(pNode: Element): string {
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

    // Check for page break in runs (e.g. w:br w:type="page")
    const brNodes = pNode.getElementsByTagNameNS("*", "br");
    for (let i = 0; i < brNodes.length; i++) {
      if (brNodes[i].getAttribute("w:type") === "page" || brNodes[i].getAttribute("type") === "page") {
        hasPageBreak = true;
      }
    }

    let innerContent = "";
    const children = Array.from(pNode.children);
    
    // Check if paragraph is list item
    let isList = false;
    const numPrNode = pPrNode ? Array.from(pPrNode.children).find(c => c.localName === "numPr") : null;
    if (numPrNode) {
      isList = true;
    }

    children.forEach(child => {
      if (child.localName === "r") {
        innerContent += parseRun(child);
      }
    });

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
      // Return as standard li, parent structures will group lists if needed, or simply render indented li items
      htmlBlock = `<li style="${pStyle}color:#e4e4e7;margin-bottom:4px;">${innerContent}</li>`;
    } else {
      htmlBlock = `<p style="${pStyle}font-size:11pt;line-height:1.6;color:#e4e4e7;margin-bottom:12px;">${innerContent}</p>`;
    }

    if (hasPageBreak) {
      htmlBlock = `<hr style="border:none;height:1px;background-color:#3f3f46;margin:16px 0;"/>` + htmlBlock;
    }

    return htmlBlock;
  }

  function parseTable(tblNode: Element): string {
    let tblHtml = '<table style="border-collapse:collapse;width:100%;margin:12px 0;border:1px solid #3f3f46">';
    const rows = Array.from(tblNode.children).filter(c => c.localName === "tr");
    
    rows.forEach(row => {
      tblHtml += "<tr>";
      const cells = Array.from(row.children).filter(c => c.localName === "tc");
      
      cells.forEach(cell => {
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
        paragraphs.forEach(p => {
          tblHtml += parseParagraph(p);
        });
        
        tblHtml += "</td>";
      });
      tblHtml += "</tr>";
    });

    tblHtml += "</table>";
    return tblHtml;
  }

  // Iterate top-level children of body
  for (const node of Array.from(bodyNode.children)) {
    if (node.localName === "p") {
      html += parseParagraph(node);
    } else if (node.localName === "tbl") {
      html += parseTable(node);
    }
  }

  // Post-process grouping contiguous <li> elements into lists
  const tempContainer = parser.parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild as HTMLElement;
  if (tempContainer) {
    let finalHtml = "";
    let activeListHtml = "";
    let inList = false;

    Array.from(tempContainer.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === "li") {
        if (!inList) {
          activeListHtml = '<ul style="list-style-type:disc;padding-left:24px;margin-bottom:12px;">';
          inList = true;
        }
        activeListHtml += (node as HTMLElement).outerHTML;
      } else {
        if (inList) {
          activeListHtml += "</ul>";
          finalHtml += activeListHtml;
          activeListHtml = "";
          inList = false;
        }
        finalHtml += node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement).outerHTML : node.textContent || "";
      }
    });

    if (inList) {
      activeListHtml += "</ul>";
      finalHtml += activeListHtml;
    }
    
    return finalHtml;
  }

  return html;
}
