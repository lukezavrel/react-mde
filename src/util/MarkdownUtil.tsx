import { SelectionRange, TextSection } from '../index.js';

export function getSurroundingWord(
  text: string,
  position: number
): SelectionRange {
  if (!text) throw Error("Argument 'text' should be truthy");

  const isWordDelimiter = (c: string) => c === ' ' || c.charCodeAt(0) === 10 || c === '<' || c === '>' || c === '*' || c === '~' || c === '`';

  // leftIndex is initialized to 0 because if selection is 0, it won't even enter the iteration
  let start = 0;
  // rightIndex is initialized to text.length because if selection is equal to text.length it won't even enter the interation
  let end = text.length;

  // iterate to the left
  for (let i = position; i - 1 > -1; i -= 1) {
    if (isWordDelimiter(text[i - 1])) {
      start = i;
      break;
    }
  }

  // iterate to the right
  for (let i = position; i < text.length; i += 1) {
    if (isWordDelimiter(text[i])) {
      end = i;
      break;
    }
  }
  if (['****', '``', '**', '~~~~'].includes(text.substring(start, end))) {
    return { start: position, end: position}
  }
  return { start, end };
}

/**
 * If the cursor is inside a word and (selection.start === selection.end)
 * returns a new Selection where the whole word is selected
 * @param text
 * @param selection
 */
export function selectWord({ text, selection }: TextSection): SelectionRange {
  if (text && text.length && selection.start === selection.end) {
    // the user is pointing to a word
    return getSurroundingWord(text, selection.start);
  }
  return selection;
}

/**
 *  Gets the number of line-breaks that would have to be inserted before the given 'startPosition'
 *  to make sure there's an empty line between 'startPosition' and the previous text
 */
export function getBreaksNeededForEmptyLineBefore(
  text: string = '',
  startPosition: number
): number {
  if (startPosition === 0) return 1;

  // rules:
  // - If we're in the first line, no breaks are needed
  // - Otherwise there must be 2 breaks before the previous character. Depending on how many breaks exist already, we
  //      may need to insert 0, 1 or 2 breaks

  let neededBreaks = 2;
  let isInFirstLine = true;
  for (let i = startPosition - 1; i >= 0 && neededBreaks >= 0; i -= 1) {
    switch (text.charCodeAt(i)) {
      case 32: // blank space
        continue;
      case 10: // line break
        if (neededBreaks > 1) {
          neededBreaks -= 1;
        }
        isInFirstLine = false;
        break;
      default:
        return neededBreaks;
    }
  }
  return isInFirstLine ? 1 : neededBreaks;
}

/**
 *  Gets the number of line-breaks that would have to be inserted after the given 'startPosition'
 *  to make sure there's an empty line between 'startPosition' and the next text
 */
export function getBreaksNeededForEmptyLineAfter(
  text: string = '',
  startPosition: number
): number {
  if (startPosition === text.length - 1) return 0;

  // rules:
  // - If we're in the first line, no breaks are needed
  // - Otherwise there must be 2 breaks before the previous character. Depending on how many breaks exist already, we
  //      may need to insert 0, 1 or 2 breaks

  let neededBreaks = 2;
  let isInLastLine = true;
  for (let i = startPosition; i < text.length && neededBreaks >= 0; i += 1) {
    switch (text.charCodeAt(i)) {
      case 32:
        continue;
      case 10: {
        neededBreaks -= 1;
        isInLastLine = false;
        break;
      }
      default:
        return neededBreaks;
    }
  }
  return isInLastLine ? 0 : neededBreaks;
}

export type ActiveInlineDecoratorKind =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'inlineCode'
  | 'textAlignCenter'
  | 'textAlignRight'
  | 'textAlignJustify';

/**
 * Open {@code <p>} tag with an inline {@code text-align} style (same pattern as toolbar HTML).
 * Use {@link getTextAlignOpenTagRegex} for matching to avoid {@code /g} {@code lastIndex} issues.
 */
export const TEXT_ALIGN_OPEN_P_TAG_RE =
  /<p[^>]*style=["'][^"']*text-align\s*:\s*[^"']+[^"']*["'][^>]*>/gi;

export function getTextAlignOpenTagRegex(): RegExp {
  return new RegExp(TEXT_ALIGN_OPEN_P_TAG_RE.source, TEXT_ALIGN_OPEN_P_TAG_RE.flags);
}

/**
 * Active inline markdown / HTML span: delimiter runs for bold/italic/code/strike, or
 * {@code <p style="text-align:...">} ... {@code </p>} for alignment. Inner content is
 * [content.start, content.end) (half-open).
 */
export type ActiveInlineDecorator = {
  kind: ActiveInlineDecoratorKind;
  open: SelectionRange;
  close: SelectionRange;
  content: SelectionRange;
};

/** Inner text is [contentStart, contentEnd); contentEnd is the index of the first char of the closing delimiter. A collapsed caret at contentEnd (gap after last inner char, before closing) counts as inside. */
function selectionInsideContent(
  selection: SelectionRange,
  contentStart: number,
  contentEnd: number
): boolean {
  const lo = Math.min(selection.start, selection.end);
  const hi = Math.max(selection.start, selection.end);
  if (lo < contentStart) return false;
  if (hi < lo) return false;
  if (hi === lo) {
    return lo >= contentStart && lo <= contentEnd;
  }
  return lo >= contentStart && hi <= contentEnd && lo < contentEnd;
}

function indexOfDelimiter(text: string, delim: string, from: number): number {
  const L = delim.length;
  if (L === 0) return -1;
  for (let i = from; i <= text.length - L; i += 1) {
    if (text.slice(i, i + L) === delim) {
      return i;
    }
  }
  return -1;
}

function tryBoldPairContaining(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  let bestOpen = -1;
  let bestClose = -1;
  let bestCs = -1;
  let bestCe = -1;
  for (let o = 0; o <= text.length - 2; o += 1) {
    if (text[o] !== '*' || text[o + 1] !== '*') continue;
    const close = indexOfDelimiter(text, '**', o + 2);
    if (close === -1) continue;
    let cs = o + 2;
    const ce = close;
    if (cs < text.length && text[cs] === '*') {
      cs += 1;
    }
    if (cs >= ce) continue;
    if (!selectionInsideContent(selection, cs, ce)) continue;
    if (o > bestOpen) {
      bestOpen = o;
      bestClose = close;
      bestCs = cs;
      bestCe = ce;
    }
  }
  if (bestOpen === -1) return null;
  return {
    kind: 'bold',
    open: { start: bestOpen, end: bestOpen + 2 },
    close: { start: bestClose, end: bestClose + 2 },
    content: { start: bestCs, end: bestCe },
  };
}

function isLoneAsterisk(text: string, i: number): boolean {
  if (text[i] !== '*') return false;
  if (i > 0 && text[i - 1] === '*') return false;
  if (i + 1 < text.length && text[i + 1] === '*') return false;
  return true;
}

/**
 * Lone `*` opener whose emphasis closes at the first `*` of a `***` run (nested inside strong
 * `**`), e.g. `**Hello *world!!!***`. {@link hasDecorators} rejects these because the window is
 * `**`-wrapped.
 */
function hasItalicLoneOpenClosedByTripleRun(
  text: string,
  openStar: number,
  contentStart: number,
  tripleStart: number
): boolean {
  if (!isLoneAsterisk(text, openStar)) return false;
  if (contentStart !== openStar + 1) return false;
  if (tripleStart < 0 || tripleStart + 3 > text.length) return false;
  if (text.slice(tripleStart, tripleStart + 3) !== '***') return false;
  if (tripleStart < contentStart) return false;
  if (text.lastIndexOf('**', openStar - 1) === -1) return false;
  return true;
}

/** Any `***...***` span (combined emphasis + strong); inner must not contain `***`. Picks innermost opening `i` whose span contains the selection. */
function tryItalicTripleAsteriskEmphasisContaining(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  let bestI = -1;
  let bestCloseIdx = -1;
  for (let i = 0; i <= text.length - 3; i += 1) {
    if (text.slice(i, i + 3) !== '***') continue;
    const innerStart = i + 3;
    const closeIdx = text.indexOf('***', innerStart);
    if (closeIdx === -1) continue;
    const cs = innerStart;
    const ce = closeIdx;
    if (ce <= cs) continue;
    if (text.slice(innerStart, closeIdx).includes('***')) continue;
    if (!selectionInsideContent(selection, cs, ce)) continue;
    if (!hasDecorators(text, cs, ce, '*')) continue;
    if (i > bestI) {
      bestI = i;
      bestCloseIdx = closeIdx;
    }
  }
  if (bestI === -1) return null;
  return {
    kind: 'italic',
    open: { start: bestI, end: bestI + 3 },
    close: { start: bestCloseIdx, end: bestCloseIdx + 3 },
    content: { start: bestI + 3, end: bestCloseIdx },
  };
}

function tryItalicPairContaining(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  const triple = tryItalicTripleAsteriskEmphasisContaining(text, selection);
  let bestOpen = -1;
  let bestClose = -1;
  let bestCloseLen = 1;
  for (let o = 0; o < text.length; o += 1) {
    if (!isLoneAsterisk(text, o)) continue;
    let c = -1;
    for (let i = o + 1; i < text.length; i += 1) {
      if (isLoneAsterisk(text, i)) {
        c = i;
        break;
      }
    }
    let tripleCloseStart = -1;
    if (c === -1) {
      for (let i = o + 1; i <= text.length - 3; i += 1) {
        if (text.slice(i, i + 3) !== '***') continue;
        const cs = o + 1;
        const ce = i;
        if (ce <= cs) continue;
        const okClose =
          hasDecorators(text, cs, ce, '*') ||
          hasItalicLoneOpenClosedByTripleRun(text, o, cs, i);
        if (!okClose) continue;
        if (!selectionInsideContent(selection, cs, ce)) continue;
        if (text.lastIndexOf('**', o - 1) === -1) continue;
        tripleCloseStart = i;
        break;
      }
    }
    const cs = o + 1;
    if (c !== -1) {
      const ce = c;
      if (!hasDecorators(text, cs, ce, '*')) continue;
      if (!selectionInsideContent(selection, cs, ce)) continue;
      if (o > bestOpen) {
        bestOpen = o;
        bestClose = c;
        bestCloseLen = 1;
      }
    } else if (tripleCloseStart !== -1) {
      const ce = tripleCloseStart;
      if (!selectionInsideContent(selection, cs, ce)) continue;
      if (o > bestOpen) {
        bestOpen = o;
        bestClose = tripleCloseStart;
        bestCloseLen = 3;
      }
    }
  }
  if (bestOpen !== -1) {
    const result: ActiveInlineDecorator =
      bestCloseLen === 3
        ? {
            kind: 'italic',
            open: { start: bestOpen, end: bestOpen + 1 },
            close: { start: bestClose, end: bestClose + 3 },
            content: { start: bestOpen + 1, end: bestClose },
          }
        : {
            kind: 'italic',
            open: { start: bestOpen, end: bestOpen + 1 },
            close: { start: bestClose, end: bestClose + 1 },
            content: { start: bestOpen + 1, end: bestClose },
          };
    if (triple && bestOpen + 1 > triple.content.start) {
      return result;
    }
    if (!triple) {
      return result;
    }
  }
  return triple;
}

function tryStrikethroughPairContaining(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  let bestOpen = -1;
  let bestClose = -1;
  for (let o = 0; o <= text.length - 2; o += 1) {
    if (text[o] !== '~' || text[o + 1] !== '~') continue;
    const close = indexOfDelimiter(text, '~~', o + 2);
    if (close === -1) continue;
    const cs = o + 2;
    const ce = close;
    if (!selectionInsideContent(selection, cs, ce)) continue;
    if (o > bestOpen) {
      bestOpen = o;
      bestClose = close;
    }
  }
  if (bestOpen === -1) return null;
  return {
    kind: 'strikethrough',
    open: { start: bestOpen, end: bestOpen + 2 },
    close: { start: bestClose, end: bestClose + 2 },
    content: { start: bestOpen + 2, end: bestClose },
  };
}

function tryInlineCodePairContaining(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  let bestOpen = -1;
  let bestClose = -1;
  for (let o = 0; o < text.length; o += 1) {
    if (text[o] !== '`') continue;
    const c = text.indexOf('`', o + 1);
    if (c === -1) continue;
    const inner = text.slice(o + 1, c);
    if (inner.includes('\n')) continue;
    const cs = o + 1;
    const ce = c;
    if (!selectionInsideContent(selection, cs, ce)) continue;
    if (o > bestOpen) {
      bestOpen = o;
      bestClose = c;
    }
  }
  if (bestOpen === -1) return null;
  return {
    kind: 'inlineCode',
    open: { start: bestOpen, end: bestOpen + 1 },
    close: { start: bestClose, end: bestClose + 1 },
    content: { start: bestOpen + 1, end: bestClose },
  };
}

function parseTextAlignKindFromOpenTag(
  openTag: string
): ActiveInlineDecoratorKind | null {
  const m = openTag.match(/text-align\s*:\s*([^"';\s>]+)/i);
  if (!m) return null;
  const v = m[1].trim().toLowerCase();
  if (v === 'center') return 'textAlignCenter';
  if (v === 'right') return 'textAlignRight';
  if (v === 'justify') return 'textAlignJustify';
  return null;
}

/** Selection inside {@code <p style="text-align:...">} ... {@code </p>} inner HTML (not on the tags). */
function tryTextAlignContaining(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  const lo = Math.min(selection.start, selection.end);
  const hi = Math.max(selection.start, selection.end);
  const before = text.slice(0, lo);
  const re = getTextAlignOpenTagRegex();
  const matches = [...before.matchAll(re)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const lastOpenIndex = last.index ?? 0;
  const lastOpenTag = last[0];
  const openContentStart = lastOpenIndex + lastOpenTag.length;
  const afterOpen = before.slice(lastOpenIndex);
  if (afterOpen.includes('</p>')) return null;
  const rest = text.slice(openContentStart);
  const closeRel = rest.indexOf('</p>');
  if (closeRel === -1) return null;
  const closeIdx = openContentStart + closeRel;
  if (!selectionInsideContent(selection, openContentStart, closeIdx)) return null;
  const kind = parseTextAlignKindFromOpenTag(lastOpenTag);
  if (!kind) return null;
  return {
    kind,
    open: { start: lastOpenIndex, end: openContentStart },
    close: { start: closeIdx, end: closeIdx + 4 },
    content: { start: openContentStart, end: closeIdx },
  };
}

const ACTIVE_INLINE_ORDER: ActiveInlineDecoratorKind[] = [
  'bold',
  'italic',
  'strikethrough',
  'inlineCode',
  'textAlignCenter',
  'textAlignRight',
  'textAlignJustify',
];

/**
 * All active inline markdown spans and aligned {@code <p>} blocks whose inner content fully
 * contains the selection (e.g. nested italic around bold returns both).
 */
export function getActiveInlineDecorators(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator[] {
  if (text == null || selection == null) return [];
  const out: ActiveInlineDecorator[] = [];
  const bold = tryBoldPairContaining(text, selection);
  if (bold) out.push(bold);
  const italic = tryItalicPairContaining(text, selection);
  if (italic) out.push(italic);
  const strike = tryStrikethroughPairContaining(text, selection);
  if (strike) out.push(strike);
  const code = tryInlineCodePairContaining(text, selection);
  if (code) out.push(code);
  const align = tryTextAlignContaining(text, selection);
  if (align) out.push(align);
  return out;
}

/**
 * Returns the active inline markdown span whose inner content fully contains the selection,
 * or null. When multiple spans apply (nested), returns one by priority: bold, italic,
 * strikethrough, inline code, then text-align. Use getActiveInlineDecorators for all matches.
 */
export function getActiveInlineDecorator(
  text: string,
  selection: SelectionRange
): ActiveInlineDecorator | null {
  const all = getActiveInlineDecorators(text, selection);
  for (let i = 0; i < ACTIVE_INLINE_ORDER.length; i += 1) {
    const kind = ACTIVE_INLINE_ORDER[i];
    const found = all.find((d) => d.kind === kind);
    if (found) return found;
  }
  return null;
}

export function hasDecorators(text: string, start: number, end: number, decorators: string): boolean {
  const decoratorsLength = decorators.length;
  if (start >= decoratorsLength && text.length >= end + decoratorsLength) {
    let textWithDecorators = text.substring(start - decoratorsLength, end + decoratorsLength);
    if (decorators === '*') {
      let italicCheckText = text.substring(start - 3, end + 3).trim();
      if (italicCheckText.substring(0, 3) === '***' && italicCheckText.substring(italicCheckText.length - 3) === '***') {
        return true;
      }
      if (italicCheckText.substring(0, 2) === '**' && italicCheckText.substring(italicCheckText.length - 2) === '**') {
        return false;
      }
    }
    if (textWithDecorators.substring(0, decoratorsLength) === decorators && textWithDecorators.substring(textWithDecorators.length - decoratorsLength) === decorators) {
      return true;
    }
  }
  return false;
}

export function hasTextAlign(text: string, start: number, end: number): boolean {
  // take the part before the selection and after the selection
  const before = text.slice(0, start);
  const after = text.slice(end);

  if (text.length > start && start > 0 && text[start - 1] !== '>') {
    return false;
  }
  if (end < text.length && text[end] !== '<') {
    return false;
  }

  // find the last open <p ...> before the selection
  const openTagMatch = before.match(getTextAlignOpenTagRegex());
  if (!openTagMatch) return false;

  const lastOpenTag = openTagMatch[openTagMatch.length - 1];

  // check that there is no closing </p> between the last open tag and the selection
  const lastOpenIndex = before.lastIndexOf(lastOpenTag);
  const afterOpen = before.slice(lastOpenIndex);

  if (afterOpen.includes("</p>")) return false;

  // check that there is a closing </p> after the selection
  const closeIndex = after.indexOf("</p>");
  if (closeIndex === -1) return false;

  return true;
}
