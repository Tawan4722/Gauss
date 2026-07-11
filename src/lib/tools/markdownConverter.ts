/**
 * Local-first offline HTML-to-Markdown and Markdown-to-HTML conversion utilities.
 */

export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  let markdown = "";

  function traverse(node: Node, inTableCell = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent || "";
      if (inTableCell) {
        // Strip out newlines inside table cells to keep the row formatting single-line
        text = text.replace(/\r?\n/g, " ");
      }
      markdown += text;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const isCell = tagName === "td" || tagName === "th";

    switch (tagName) {
      case "h1":
        markdown += inTableCell ? " " : "\n# ";
        break;
      case "h2":
        markdown += inTableCell ? " " : "\n## ";
        break;
      case "h3":
        markdown += inTableCell ? " " : "\n### ";
        break;
      case "p":
      case "div":
        if (inTableCell) {
          if (markdown.trim() && !markdown.endsWith("|") && !markdown.endsWith(" ")) {
            markdown += "<br>";
          }
        } else {
          markdown += "\n\n";
        }
        break;
      case "strong":
      case "b":
        markdown += "**";
        break;
      case "em":
      case "i":
        markdown += "*";
        break;
      case "u":
        markdown += "<u>";
        break;
      case "sup":
        markdown += "<sup>";
        break;
      case "sub":
        markdown += "<sub>";
        break;
      case "a":
        markdown += "[";
        break;
      case "ul":
        markdown += inTableCell ? " " : "\n";
        break;
      case "ol":
        markdown += inTableCell ? " " : "\n";
        break;
      case "li":
        if (inTableCell) {
          markdown += " • ";
        } else {
          const parent = el.parentElement;
          if (parent && parent.tagName.toLowerCase() === "ol") {
            const index = Array.from(parent.children).indexOf(el) + 1;
            markdown += `\n${index}. `;
          } else {
            markdown += "\n- ";
          }
        }
        break;
      case "br":
        markdown += inTableCell ? "<br>" : "\n";
        break;
      case "table":
        markdown += inTableCell ? "" : "\n\n";
        break;
      case "tr":
        markdown += inTableCell ? "" : "\n|";
        break;
      case "td":
      case "th":
        markdown += " ";
        break;
    }

    // Traverse children
    for (let i = 0; i < el.childNodes.length; i++) {
      traverse(el.childNodes[i], inTableCell || isCell);
    }

    // Close tags
    switch (tagName) {
      case "strong":
      case "b":
        markdown += "**";
        break;
      case "em":
      case "i":
        markdown += "*";
        break;
      case "u":
        markdown += "</u>";
        break;
      case "sup":
        markdown += "</sup>";
        break;
      case "sub":
        markdown += "</sub>";
        break;
      case "a":
        const href = el.getAttribute("href") || "#";
        markdown += `](${href})`;
        break;
      case "td":
      case "th":
        markdown += " |";
        break;
      case "tr":
        if (!inTableCell) {
          // Check if header row to draw table divider line
          const isHeader = Array.from(el.children).every(c => c.tagName.toLowerCase() === "th");
          if (isHeader && el.children.length > 0) {
            markdown += "\n|";
            for (let i = 0; i < el.children.length; i++) {
              markdown += " --- |";
            }
          }
        }
        break;
    }
  }

  traverse(body);
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

function parseInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/<sup>(.*?)<\/sup>/g, "<sup>$1</sup>")
    .replace(/<sub>(.*?)<\/sub>/g, "<sub>$1</sub>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#22d3ee;text-decoration:underline;">$1</a>');
}

function renderHtmlTable(rows: string[][], hasHeader: boolean): string {
  let html = '<table style="border-collapse:collapse;width:100%;margin:12px 0;border:1px solid #3f3f46;">';
  rows.forEach((row, rowIndex) => {
    html += "<tr>";
    row.forEach(cell => {
      const cellContent = parseInlineMarkdown(cell);
      if (hasHeader && rowIndex === 0) {
        html += `<th style="border:1px solid #3f3f46;padding:8px 12px;font-weight:bold;background-color:#0d0e0d;color:#22d3ee;text-align:left;">${cellContent}</th>`;
      } else {
        html += `<td style="border:1px solid #3f3f46;padding:8px 12px;color:#e4e4e7;">${cellContent}</td>`;
      }
    });
    html += "</tr>";
  });
  html += "</table>";
  return html;
}

export function markdownToHtml(md: string): string {
  // 1. Parse tables in Markdown first
  const lines = md.split("\n");
  const processedLines: string[] = [];
  
  let inTable = false;
  let tableRows: string[][] = [];
  let hasHeaderSeparator = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if it starts and ends with |
    const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1;
    
    if (isTableRow) {
      const cells = trimmed.split("|").map(c => c.trim());
      if (cells[0] === "") cells.shift();
      if (cells[cells.length - 1] === "") cells.pop();
      
      const isSeparator = cells.every(cell => /^[:-]+$/.test(cell));
      
      if (isSeparator) {
        hasHeaderSeparator = true;
      } else {
        if (!inTable) {
          inTable = true;
          tableRows = [];
          hasHeaderSeparator = false;
        }
        tableRows.push(cells);
      }
    } else {
      if (inTable) {
        processedLines.push(renderHtmlTable(tableRows, hasHeaderSeparator));
        inTable = false;
        tableRows = [];
      }
      processedLines.push(line);
    }
  }
  
  if (inTable) {
    processedLines.push(renderHtmlTable(tableRows, hasHeaderSeparator));
  }

  // 2. Perform inline substitutions on headings, divider rules, bold, italics, etc.
  const html = processedLines.join("\n")
    // Replace headings
    .replace(/^# (.*$)/gim, '<h1 style="font-family:\'Geist Sans\';font-size:24pt;color:#22d3ee;font-weight:bold;margin:0 0 16px;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-family:\'Geist Sans\';font-size:18pt;color:#22d3ee;font-weight:bold;margin:16px 0 8px;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-family:\'Geist Sans\';font-size:14pt;color:#fbbf24;font-weight:bold;margin:12px 0 6px;">$1</h3>')
    
    // Bold, Italic, Underline, Superscript, Subscript
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/<sup>(.*?)<\/sup>/g, "<sup>$1</sup>")
    .replace(/<sub>(.*?)<\/sub>/g, "<sub>$1</sub>")

    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#22d3ee;text-decoration:underline;">$1</a>')

    // Horizontal Rule / Divider
    .replace(/^---$/gim, '<hr style="border:none;height:1px;background-color:#3f3f46;margin:16px 0;"/>');

  // 3. Parse paragraphs and stack-based lists
  const docLines = html.split("\n");
  const formattedLines: string[] = [];
  const listStack: { type: "ul" | "ol"; indent: number }[] = [];

  function closeLists(targetIndent: number) {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
      const popped = listStack.pop();
      if (popped) {
        formattedLines.push(popped.type === "ul" ? "</ul>" : "</ol>");
      }
    }
  }

  for (const line of docLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Close all lists
      while (listStack.length > 0) {
        const popped = listStack.pop();
        if (popped) formattedLines.push(popped.type === "ul" ? "</ul>" : "</ol>");
      }
      continue;
    }

    const bulletMatch = line.match(/^(\s*)([-*]|\+)\s+(.*)$/);
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[3];
      
      closeLists(indent);
      
      const currentList = listStack[listStack.length - 1];
      if (!currentList || currentList.indent < indent) {
        formattedLines.push('<ul style="list-style-type:disc;padding-left:24px;margin-bottom:12px;">');
        listStack.push({ type: "ul", indent });
      } else if (currentList.type !== "ul") {
        formattedLines.push("</ol>");
        listStack.pop();
        formattedLines.push('<ul style="list-style-type:disc;padding-left:24px;margin-bottom:12px;">');
        listStack.push({ type: "ul", indent });
      }
      
      formattedLines.push(`<li style="color:#e4e4e7;margin-bottom:4px;">${content}</li>`);
    } else if (numberedMatch) {
      const indent = numberedMatch[1].length;
      const content = numberedMatch[3];
      
      closeLists(indent);
      
      const currentList = listStack[listStack.length - 1];
      if (!currentList || currentList.indent < indent) {
        formattedLines.push('<ol style="list-style-type:decimal;padding-left:24px;margin-bottom:12px;">');
        listStack.push({ type: "ol", indent });
      } else if (currentList.type !== "ol") {
        formattedLines.push("</ul>");
        listStack.pop();
        formattedLines.push('<ol style="list-style-type:decimal;padding-left:24px;margin-bottom:12px;">');
        listStack.push({ type: "ol", indent });
      }
      
      formattedLines.push(`<li style="color:#e4e4e7;margin-bottom:4px;">${content}</li>`);
    } else {
      // Close all lists
      while (listStack.length > 0) {
        const popped = listStack.pop();
        if (popped) formattedLines.push(popped.type === "ul" ? "</ul>" : "</ol>");
      }

      // Check if it's already a header, block tag, or table row
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<tr") ||
        trimmed.startsWith("<td") ||
        trimmed.startsWith("<th") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("<p")
      ) {
        formattedLines.push(trimmed);
      } else {
        formattedLines.push(`<p style="font-family:'Geist Sans';font-size:11pt;line-height:1.6;color:#e4e4e7;margin-bottom:12px;">${trimmed}</p>`);
      }
    }
  }

  while (listStack.length > 0) {
    const popped = listStack.pop();
    if (popped) formattedLines.push(popped.type === "ul" ? "</ul>" : "</ol>");
  }

  return formattedLines.join("\n");
}
