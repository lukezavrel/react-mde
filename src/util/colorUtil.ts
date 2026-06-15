import { TextApi, TextState } from '../index.js';
import { selectWord } from './MarkdownUtil.js';
import {
  buildStyleSpanOpen,
  findStyleSpanContaining,
  normalizeColor,
  StyleSpanStyles,
  STYLE_SPAN_CLOSE,
} from './styleSpanUtil.js';

export {
  buildStyleSpanOpen,
  findStyleSpanContaining,
  getActiveBackgroundColor,
  getActiveTextColor,
  normalizeColor,
  parseStyleSpanOpenTag,
  STYLE_SPAN_CLOSE,
} from './styleSpanUtil.js';

export type { StyleSpanMatch, StyleSpanStyles } from './styleSpanUtil.js';

export type ApplyInlineColorOptions = {
  property: 'color' | 'background-color';
  value: string | null;
};

function wrapSegment(
  text: string,
  styles: StyleSpanStyles,
): { html: string; contentStart: number; contentEnd: number } {
  if (!text) {
    return { html: '', contentStart: 0, contentEnd: 0 };
  }
  const openTag = buildStyleSpanOpen(styles);
  if (!openTag) {
    return { html: text, contentStart: 0, contentEnd: text.length };
  }
  return {
    html: `${openTag}${text}${STYLE_SPAN_CLOSE}`,
    contentStart: openTag.length,
    contentEnd: openTag.length + text.length,
  };
}

function stylesForPropertyChange(
  baseStyles: StyleSpanStyles,
  options: ApplyInlineColorOptions,
): StyleSpanStyles {
  const styles: StyleSpanStyles = { ...baseStyles };
  if (options.property === 'color') {
    if (options.value) {
      styles.color = normalizeColor(options.value);
    } else {
      delete styles.color;
    }
  } else if (options.value) {
    styles.backgroundColor = normalizeColor(options.value);
  } else {
    delete styles.backgroundColor;
  }
  return styles;
}

export function applyInlineColor(
  getTextState: () => TextState,
  textApi: TextApi,
  options: ApplyInlineColorOptions,
): void {
  const initialState = getTextState();
  const newSelectionRange = selectWord({
    text: initialState.text,
    selection: initialState.selection,
  });
  textApi.setSelectionRange(newSelectionRange);
  const selectedText = textApi.getState().selectedText;
  const spanMatch = findStyleSpanContaining(initialState.text, newSelectionRange);

  if (spanMatch) {
    const parentStyles = spanMatch.styles;
    const before = initialState.text.slice(
      spanMatch.content.start,
      newSelectionRange.start,
    );
    const after = initialState.text.slice(
      newSelectionRange.end,
      spanMatch.content.end,
    );
    const selectedStyles = stylesForPropertyChange(parentStyles, options);

    const beforePart = wrapSegment(before, parentStyles);
    const selectedPart = wrapSegment(selectedText, selectedStyles);
    const afterPart = wrapSegment(after, parentStyles);
    const replacement =
      beforePart.html + selectedPart.html + afterPart.html;

    textApi.setSelectionRange({
      start: spanMatch.open.start,
      end: spanMatch.close.end,
    });

    textApi.replaceSelection(replacement);
    const replacementStart = spanMatch.open.start;
    const selectedInnerStart =
      replacementStart +
      beforePart.html.length +
      selectedPart.contentStart;
    const selectedInnerEnd =
      replacementStart +
      beforePart.html.length +
      selectedPart.contentEnd;
    textApi.setSelectionRange({
      start: selectedInnerStart,
      end: selectedInnerEnd,
    });
    return;
  }

  if (!options.value) {
    return;
  }

  const newStyles: StyleSpanStyles = {};
  if (options.property === 'color') {
    newStyles.color = normalizeColor(options.value);
  } else {
    newStyles.backgroundColor = normalizeColor(options.value);
  }
  const openTag = buildStyleSpanOpen(newStyles);
  const state2 = textApi.replaceSelection(
    `${openTag}${selectedText}${STYLE_SPAN_CLOSE}`,
  );
  textApi.setSelectionRange({
    start: state2.selection.end - STYLE_SPAN_CLOSE.length - selectedText.length,
    end: state2.selection.end - STYLE_SPAN_CLOSE.length,
  });
}
