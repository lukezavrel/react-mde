import * as React from 'react';
import { ToolbarButton, useReactMde } from '../components/index.js';
import { hasDecorators, selectWord } from '../util/MarkdownUtil.js';

const StrikeThroughCommand = () => {
  const { getTextState, textApi, getIcon } = useReactMde();

  return (
    <ToolbarButton
      name="strikethrough"
      aria-label="Add strikethrough text"
      onClick={() => {
        const initialState = getTextState();
        const newSelectionRange = selectWord({
          text: initialState.text,
          selection: initialState.selection,
        });
        let state1 = textApi.setSelectionRange(newSelectionRange);
        const selectedText = state1.selectedText;
        const hasDecoratorsValue = hasDecorators(initialState.text, newSelectionRange.start, newSelectionRange.end, '~~')
        if (hasDecoratorsValue) {
          state1 = textApi.setSelectionRange({
            start: newSelectionRange.start - 2,
            end: newSelectionRange.end + 2,
          });
          // Replaces the current selection with the strikethrough mark up
          const state2 = textApi.replaceSelection(`${selectedText}`);
          // Adjust the selection to not contain the ~~
          textApi.setSelectionRange({
            start: state2.selection.end - selectedText.length,
            end: state2.selection.end,
          });

        } else {
          // Replaces the current selection with the strikethrough mark up
          const state2 = textApi.replaceSelection(`~~${state1.selectedText}~~`);
          // Adjust the selection to not contain the ~~
          textApi.setSelectionRange({
            start: state2.selection.end - 2 - state1.selectedText.length,
            end: state2.selection.end - 2,
          });
        }
      }}>
      {getIcon('strikethrough')}
    </ToolbarButton>
  );
};

export default StrikeThroughCommand;
