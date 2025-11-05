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
  if (!formats || formats.length === 0) {
    return text;
  }

  const points = new Map<number, string[]>();

  const addTag = (index: number, tag: string) => {
    if (!points.has(index)) {
      points.set(index, []);
    }
    points.get(index)!.push(tag);
  };

  formats.forEach((format) => {
    let openTag = "";
    let closeTag = "";
    let style = "";

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
      if (format.font) style += `font-family: ${format.font};`;
      if (format.size) style += `font-size: ${format.size}px;`;
    }

    if (style) {
      openTag += `<span style="${style}">`;
      closeTag = "</span>" + closeTag;
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
      result += text.substring(lastIndex, index);
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
    result += text.substring(lastIndex);
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
      text += node.textContent || "";
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
      }

      // Prefer inline style, but fall back to computed style to capture
      // fonts/sizes coming from the backend or inherited CSS rules.
      const computed = window.getComputedStyle(el);
      const rawFont = el.style.fontFamily || computed.fontFamily || "";
      const rawSize = el.style.fontSize || computed.fontSize || "";

      const normalizeFont = (fontValue?: string): string | undefined => {
        if (!fontValue) return undefined;
        // font-family can be a list: "Inter, Roboto, sans-serif".
        // Take the first family and trim quotes/spaces.
        const parts = fontValue.split(",");
        if (!parts || parts.length === 0) return undefined;
        const first = parts[0] ? parts[0].trim() : parts[0];
        return first ? first.replace(/^['\"]|['\"]$/g, "") : undefined;
      };

      const parseFontSizeToPx = (sizeValue: string): number | undefined => {
        if (!sizeValue) return undefined;
        // If value already in px
        const pxMatch = sizeValue.match(/^([0-9]+(?:\.[0-9]+)?)px$/);
        if (pxMatch && pxMatch[1]) return Math.round(parseFloat(pxMatch[1]));

        // If in em/rem/pt/% etc, try to compute using browser computed style
        // by temporarily applying to a test element if needed. However,
        // since we already used getComputedStyle above, sizeValue should be
        // computed and usually in px. Try to parse any number out of it.
        const numMatch = sizeValue.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (numMatch && numMatch[1]) return Math.round(parseFloat(numMatch[1]));

        return undefined;
      };

      const fontName = normalizeFont(rawFont);
      const fontSize = parseFontSizeToPx(rawSize);

      // detect strikethrough via inline style or computed text-decoration
      try {
        const inlineDec =
          (el.style &&
            (el.style.textDecoration ||
              (el.style as any).textDecorationLine)) ||
          "";
        const computedDec =
          (computed &&
            ((computed as any).textDecorationLine ||
              (computed as any).textDecoration)) ||
          "";
        if (
          (inlineDec && String(inlineDec).indexOf("line-through") !== -1) ||
          (computedDec && String(computedDec).indexOf("line-through") !== -1)
        ) {
          newFormats.strikethrough = true;
        }
      } catch (e) {
        /* ignore */
      }

      if (fontName) newFormats.font = fontName;
      if (typeof fontSize === "number" && !isNaN(fontSize))
        newFormats.size = fontSize;

      el.childNodes.forEach((child) => traverse(child, newFormats));
    }
  }

  traverse(element, {});
  return { text, formats };
}

// Debug helper: performs reconstructHtmlFromFormats -> parseHtmlToTextAndFormats
// roundtrip and returns parsed formats. Useful to run in console for verification.
export function roundtripCheckForDebug(
  text: string,
  formats: BlockTextFormat[]
) {
  const html = reconstructHtmlFromFormats(text, formats);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = doc.body as HTMLElement;
  return parseHtmlToTextAndFormats(el);
}
