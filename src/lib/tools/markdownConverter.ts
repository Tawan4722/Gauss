/**
 * Local-first offline HTML-to-Markdown and Markdown-to-HTML conversion utilities.
 */

export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  let markdown = "";

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.textContent || "";
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
        markdown += "\n# ";
        break;
      case "h2":
        markdown += "\n## ";
        break;
      case "h3":
        markdown += "\n### ";
        break;
      case "p":
      case "div":
        markdown += "\n\n";
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
        markdown += "\n";
        break;
      case "ol":
        markdown += "\n";
        break;
      case "li":
        const parent = el.parentElement;
        if (parent && parent.tagName.toLowerCase() === "ol") {
          const index = Array.from(parent.children).indexOf(el) + 1;
          markdown += `\n${index}. `;
        } else {
          markdown += "\n- ";
        }
        break;
      case "br":
        markdown += "\n";
        break;
      case "table":
        markdown += "\n\n";
        break;
      case "tr":
        markdown += "\n|";
        break;
      case "td":
      case "th":
        markdown += " ";
        break;
    }

    // Traverse children
    for (let i = 0; i < el.childNodes.length; i++) {
      traverse(el.childNodes[i]);
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
        // Check if header row to draw table divider line
        const isHeader = Array.from(el.children).every(c => c.tagName.toLowerCase() === "th");
        if (isHeader && el.children.length > 0) {
          markdown += "\n|";
          for (let i = 0; i < el.children.length; i++) {
            markdown += " --- |";
          }
        }
        break;
    }
  }

  traverse(body);
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

export function markdownToHtml(md: string): string {
  // Convert standard markdown structures into safe HTML
  let html = md
    // Replace headings
    .replace(/^# (.*$)/gim, '<h1 style="font-family:\'Geist Sans\';font-size:24pt;color:#22d3ee;font-weight:bold;margin:0 0 16px;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-family:\'Geist Sans\';font-size:18pt;color:#22d3ee;font-weight:bold;margin:16px 0 8px;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-family:\'Geist Sans\';font-size:14pt;color:#fbbf24;font-weight:bold;margin:12px 0 6px;">$1</h3>')
    
    // Bold, Italic, Underline
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/<sup>(.*?)<\/sup>/g, "<sup>$1</sup>")
    .replace(/<sub>(.*?)<\/sub>/g, "<sub>$1</sub>")

    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#22d3ee;text-decoration:underline;">$1</a>')

    // Horizontal Rule / Divider
    .replace(/^---$/gim, '<hr style="border:none;height:1px;background-color:#3f3f46;margin:16px 0;"/>');

  // Parse paragraphs and lists
  const lines = html.split("\n");
  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let formattedLines: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        formattedLines.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
        listType = null;
      }
      continue;
    }

    // List item detection
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const isNumbered = /^\d+\.\s/.test(trimmed);

    if (isBullet) {
      if (!inList || listType !== "ul") {
        if (inList) formattedLines.push(listType === "ul" ? "</ul>" : "</ol>");
        formattedLines.push('<ul style="list-style-type:disc;padding-left:24px;margin-bottom:12px;">');
        inList = true;
        listType = "ul";
      }
      const itemContent = trimmed.substring(2);
      formattedLines.push(`<li style="color:#e4e4e7;margin-bottom:4px;">${itemContent}</li>`);
    } else if (isNumbered) {
      if (!inList || listType !== "ol") {
        if (inList) formattedLines.push(listType === "ul" ? "</ul>" : "</ol>");
        formattedLines.push('<ol style="list-style-type:decimal;padding-left:24px;margin-bottom:12px;">');
        inList = true;
        listType = "ol";
      }
      const itemContent = trimmed.replace(/^\d+\.\s/, "");
      formattedLines.push(`<li style="color:#e4e4e7;margin-bottom:4px;">${itemContent}</li>`);
    } else {
      if (inList) {
        formattedLines.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
        listType = null;
      }

      // Check if it's already a header or block tag
      if (trimmed.startsWith("<h") || trimmed.startsWith("<hr") || trimmed.startsWith("<table") || trimmed.startsWith("<tr") || trimmed.startsWith("<div")) {
        formattedLines.push(trimmed);
      } else {
        formattedLines.push(`<p style="font-family:\'Geist Sans\';font-size:11pt;line-height:1.6;color:#e4e4e7;margin-bottom:12px;">${trimmed}</p>`);
      }
    }
  }

  if (inList) {
    formattedLines.push(listType === "ul" ? "</ul>" : "</ol>");
  }

  return formattedLines.join("\n");
}
