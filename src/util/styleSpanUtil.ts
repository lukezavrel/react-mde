import { SelectionRange } from '../index.js';

export const STYLE_SPAN_CLOSE = '</span>';

export type StyleSpanStyles = {
  color?: string;
  backgroundColor?: string;
};

export type StyleSpanMatch = {
  open: SelectionRange;
  close: SelectionRange;
  content: SelectionRange;
  styles: StyleSpanStyles;
};

const STYLE_SPAN_OPEN_RE =
  /<span[^>]*style\s*=\s*["']([^"']*)["'][^>]*>/gi;

export function getStyleSpanOpenTagRegex(): RegExp {
  return new RegExp(STYLE_SPAN_OPEN_RE.source, STYLE_SPAN_OPEN_RE.flags);
}

export function normalizeColor(value: string): string {
  return value.trim().toLowerCase();
}

export function parseStyleSpanOpenTag(openTag: string): StyleSpanStyles {
  const styleMatch = openTag.match(/style\s*=\s*["']([^"']*)["']/i);
  if (!styleMatch) {
    return {};
  }
  const styleStr = styleMatch[1];
  const styles: StyleSpanStyles = {};
  const colorMatch = styleStr.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  if (colorMatch) {
    styles.color = normalizeColor(colorMatch[1]);
  }
  const bgMatch = styleStr.match(/background-color\s*:\s*([^;]+)/i);
  if (bgMatch) {
    styles.backgroundColor = normalizeColor(bgMatch[1]);
  }
  return styles;
}

export function buildStyleSpanOpen(styles: StyleSpanStyles): string {
  const parts: string[] = [];
  if (styles.color) {
    parts.push(`color:${styles.color}`);
  }
  if (styles.backgroundColor) {
    parts.push(`background-color:${styles.backgroundColor}`);
  }
  if (parts.length === 0) {
    return '';
  }
  return `<span style="${parts.join(';')}">`;
}

function selectionInsideContent(
  selection: SelectionRange,
  contentStart: number,
  contentEnd: number,
): boolean {
  const lo = Math.min(selection.start, selection.end);
  const hi = Math.max(selection.start, selection.end);
  if (lo < contentStart) {
    return false;
  }
  if (hi === lo) {
    return lo >= contentStart && lo <= contentEnd;
  }
  return lo >= contentStart && hi <= contentEnd && lo < contentEnd;
}

function findClosingSpanIndex(text: string, openContentStart: number): number {
  let depth = 1;
  let i = openContentStart;
  const closeStr = '</span>';
  while (i < text.length) {
    const nextOpen = text.toLowerCase().indexOf('<span', i);
    const nextClose = text.indexOf(closeStr, i);
    if (nextClose === -1) {
      return -1;
    }
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 5;
    } else {
      depth -= 1;
      if (depth === 0) {
        return nextClose;
      }
      i = nextClose + closeStr.length;
    }
  }
  return -1;
}

export function findStyleSpanContaining(
  text: string,
  selection: SelectionRange,
): StyleSpanMatch | null {
  if (text == null || selection == null) {
    return null;
  }
  const re = getStyleSpanOpenTagRegex();
  let best: StyleSpanMatch | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const openStart = m.index;
    const openTag = m[0];
    const openEnd = openStart + openTag.length;
    const closeIdx = findClosingSpanIndex(text, openEnd);
    if (closeIdx === -1) {
      continue;
    }
    if (!selectionInsideContent(selection, openEnd, closeIdx)) {
      continue;
    }
    if (!best || openStart > best.open.start) {
      best = {
        open: { start: openStart, end: openEnd },
        close: { start: closeIdx, end: closeIdx + STYLE_SPAN_CLOSE.length },
        content: { start: openEnd, end: closeIdx },
        styles: parseStyleSpanOpenTag(openTag),
      };
    }
  }
  return best;
}

export function getActiveTextColor(
  text: string,
  selection: SelectionRange,
): string | undefined {
  return findStyleSpanContaining(text, selection)?.styles.color;
}

export function getActiveBackgroundColor(
  text: string,
  selection: SelectionRange,
): string | undefined {
  return findStyleSpanContaining(text, selection)?.styles.backgroundColor;
}
