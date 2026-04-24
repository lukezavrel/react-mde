import * as React from 'react';
import { useCallback, useState } from 'react';
import { ToolbarDropdown, useReactMde } from '../components/index.js';
import { selectWord, hasTextAlign } from '../util/MarkdownUtil.js';

const TextAlignCommands = () => {
  const { getTextState, textApi, getIcon, l18n } =
    useReactMde();

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
    const openTagMatch = before.match(/<p[^>]*style=["'][^"']*text-align\s*:\s*[^"']+[^"']*["'][^>]*>/gi);
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

  return (
    <ToolbarDropdown dropdownContent={getIcon('text-align-center')} readOnly={false}>
      {(close) => (
        <div style={{ width: 'max-content' }}>
          <button
            name="text-align-left"
            type="button"
            aria-label="Align text left"
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
