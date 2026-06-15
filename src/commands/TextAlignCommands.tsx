import * as React from 'react';
import { useCallback, useState } from 'react';
import { ToolbarDropdown, useReactMde } from '../components/index.js';
import {
  selectWord,
  hasTextAlign,
  getActiveInlineDecorators,
  getTextAlignOpenTagRegex,
} from '../util/MarkdownUtil.js';

const TextAlignCommands = () => {
  const { getTextState, textApi, getIcon, selectionRevision } = useReactMde();
  void selectionRevision;
  const { text, selection } = getTextState();
  const activeKinds = getActiveInlineDecorators(text, selection).map((d) => d.kind);

  const onClick = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
   const initialState = getTextState();
   // Adjust the selection to encompass the whole word if the caret is inside one
   const newSelectionRange = selectWord({
     text: initialState.text,
     selection: initialState.selection,
   });
   let state1 = textApi.setSelectionRange(newSelectionRange);
   const selectedText = state1.selectedText;
   const hasTextAlignValue = hasTextAlign(initialState.text, newSelectionRange.start, newSelectionRange.end);
   if (hasTextAlignValue) {
    const textSuffix = `</p>`;
    // set selection to include the text align html
    const before = initialState.text.slice(0, newSelectionRange.start);
    const openTagMatch = before.match(getTextAlignOpenTagRegex());
     const lastOpenTag = openTagMatch[openTagMatch.length - 1];
     const lastOpenIndex = before.lastIndexOf(lastOpenTag);
     state1 = textApi.setSelectionRange({
         start: lastOpenIndex,
         end: newSelectionRange.end + textSuffix.length,
       });
    const textPrefix = `<p style="text-align: ${align};">`;
    // remove the text align html
    if (align === 'left') {
        const state2 = textApi.replaceSelection(`${selectedText}`);
        // Adjust the selection
        textApi.setSelectionRange({
          start: state2.selection.end - selectedText.length,
          end: state2.selection.end,
        });
    } else {
        const state2 = textApi.replaceSelection(`${textPrefix}${selectedText}${textSuffix}`);
        // Adjust the selection to not contain the text align html
        textApi.setSelectionRange({
          start: state2.selection.end - selectedText.length - textSuffix.length,
          end: state2.selection.end - textSuffix.length,
        });
    }
   } else {
    if (align === 'left') {
        return;
    }
     // Replaces the current selection with the text align html
     const textPrefix = `<p style="text-align: ${align};">`;
     const textSuffix = `</p>`;
     const state2 = textApi.replaceSelection(`${textPrefix}${selectedText}${textSuffix}`);
     // Adjust the selection to not contain the text prefix and suffix
     textApi.setSelectionRange({
       start: state2.selection.end - textSuffix.length - selectedText.length,
       end: state2.selection.end - textSuffix.length,
     });
   }
  }, []);
  let icon = getIcon('text-align-left');
  let highlightIcon = false;
  if (activeKinds.includes('textAlignCenter')) {
    icon = getIcon('text-align-center');
    highlightIcon = true; 
  } else if (activeKinds.includes('textAlignRight')) {
    icon = getIcon('text-align-right');
    highlightIcon = true;
  } else if (activeKinds.includes('textAlignJustify')) {
    icon = getIcon('text-align-justify');
    highlightIcon = true;
  }
  return (
    <ToolbarDropdown dropdownContent={icon} active={highlightIcon} readOnly={false}>
      {(close) => (
        <div style={{ width: 'max-content' }}>
          <button
            name="text-align-left"
            type="button"
            aria-label="Align text left"
            className="mde-text-align-left"
            onClick={() => {
              onClick('left');
              close();
            }}>
            {getIcon('text-align-left')}
          </button>
          <button
            name="text-align-center"
            type="button"
            aria-label="Align text center"
            className="mde-text-align-center"
            onClick={() => {
              onClick('center');
              close();
            }}>
            {getIcon('text-align-center')}
          </button>
          <button
            name="text-align-right"
            type="button"
            aria-label="Align text right"
            className="mde-text-align-right"
            onClick={() => {
              onClick('right');
              close();
            }}>
            {getIcon('text-align-right')}
          </button>
          <button
            name="text-align-justify"
            type="button"
            aria-label="Align text justify"
            className="mde-text-align-justify"
            onClick={() => {
              onClick('justify');
              close();
            }}>
            {getIcon('text-align-justify')}
          </button>
        </div>
      )}
    </ToolbarDropdown>
  );
};

export default TextAlignCommands;
