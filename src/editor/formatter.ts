import { sizeMap } from "./constants";

export interface BlockTextFormat {
  start_offset: number;
  end_offset: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: string | null;
  font?: string;
  size?: number;
}

export function reconstructHtmlFromFormats(
  text: string = "",
  formats: BlockTextFormat[] = []
): string {
  const escapeAndReplace = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

  if (!formats || formats.length === 0) {
    return escapeAndReplace(text);
  }

  const points = new Map<number, string[]>();

  const addTag = (index: number, tag: string) => {
    if (!points.has(index)) {
      points.set(index, []);
    }
    points.get(index)!.push(tag);
  };

  const reverseSizeMap: { [key: number]: string } = Object.fromEntries(
    Object.entries(sizeMap).map(([key, value]) => [value, key])
  );

  formats.forEach((format) => {
    let openTag = "";
    let closeTag = "";

    if (format.bold) {
      openTag += "<b>";
      closeTag = "</b>" + closeTag;
    }
    if (format.italic) {
      openTag += "<i>";
      closeTag = "</i>" + closeTag;
    }
    if (format.underline) {
      openTag += "<u>";
      closeTag = "</u>" + closeTag;
    }
    if (format.strikethrough) {
      openTag += "<s>";
      closeTag = "</s>" + closeTag;
    }

    if (format.font || format.size) {
      let fontTag = "<font";
      if (format.font) fontTag += ` face="${format.font}"`;
      if (format.size && reverseSizeMap[format.size]) {
        fontTag += ` size="${reverseSizeMap[format.size]}"`;
      }
      fontTag += ">";
      openTag += fontTag;
      closeTag = "</font>" + closeTag;
    }

    if (format.link) {
      openTag += `<a href="${format.link}">`;
      closeTag = "</a>" + closeTag;
    }

    addTag(format.start_offset, openTag);
    addTag(format.end_offset, closeTag);
  });

  let result = "";
  const sortedIndices = Array.from(points.keys()).sort((a, b) => a - b);
  let lastIndex = 0;

  for (const index of sortedIndices) {
    if (index > lastIndex) {
      result += escapeAndReplace(text.substring(lastIndex, index));
    }

    const tags = points.get(index)!;
    const closingTags = tags
      .filter((t) => t.startsWith("</"))
      .sort()
      .reverse()
      .join("");
    const openingTags = tags
      .filter((t) => !t.startsWith("</"))
      .sort()
      .join("");

    result += closingTags + openingTags;

    lastIndex = index;
  }

  if (lastIndex < text.length) {
    result += escapeAndReplace(text.substring(lastIndex));
  }

  return result;
}

export function parseHtmlToTextAndFormats(element: HTMLElement): {
  text: string;
  formats: BlockTextFormat[];
} {
  let text = "";
  const formats: BlockTextFormat[] = [];

  function traverse(
    node: Node,
    currentFormats: Omit<BlockTextFormat, "start_offset" | "end_offset">
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const startOffset = text.length;
      const content = (node.textContent || "").replace(/\u200B/g, "");
      text += content;
      const endOffset = text.length;

      const activeStyleKeys = Object.keys(currentFormats).filter(
        (key) => currentFormats[key as keyof typeof currentFormats]
      );
      if (activeStyleKeys.length > 0 && startOffset < endOffset) {
        formats.push({
          ...currentFormats,
          start_offset: startOffset,
          end_offset: endOffset,
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName.toLowerCase() === "br") {
        text += "\n";
        return;
      }
      const newFormats: Omit<BlockTextFormat, "start_offset" | "end_offset"> = {
        ...currentFormats,
      };

      switch (el.tagName.toLowerCase()) {
        case "b":
          newFormats.bold = true;
          break;
        case "i":
          newFormats.italic = true;
          break;
        case "u":
          newFormats.underline = true;
          break;
        case "s":
          newFormats.strikethrough = true;
          break;
        case "a":
          newFormats.link = el.getAttribute("href");
          break;
        case "font":
          if (el.getAttribute("face")) {
            newFormats.font = el.getAttribute("face")!;
          }
          const sizeKey = el.getAttribute("size");
          if (sizeKey) {
            const size = sizeMap[sizeKey];
            if (size !== undefined) {
              newFormats.size = size;
            }
          }
          break;
      }

      if (el.style.fontFamily) {
        newFormats.font = el.style.fontFamily;
      }
      if (el.style.fontSize) {
        const size = parseInt(el.style.fontSize, 10);
        if (!isNaN(size)) {
          newFormats.size = size;
        }
      }

      el.childNodes.forEach((child) => traverse(child, newFormats));
    }
  }

  traverse(element, {});
  return { text, formats };
}
