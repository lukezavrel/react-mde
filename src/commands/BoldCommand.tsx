import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { ToolbarButton, useReactMde } from '../components/index.js';
import { selectWord, hasDecorators, getActiveInlineDecorators } from '../util/MarkdownUtil.js';

const BoldCommand = () => {
  const { getTextState, textApi, getIcon, registerEventHandler, selectionRevision } =
    useReactMde();
  void selectionRevision;
  const { text, selection } = getTextState();
  const pressed = getActiveInlineDecorators(text, selection).some(
    (d) => d.kind === 'bold',
  );

  const onClick = useCallback(() => {
    const initialState = getTextState();
    // Adjust the selection to encompass the whole word if the caret is inside one
    const newSelectionRange = selectWord({
      text: initialState.text,
      selection: initialState.selection,
    });
    let state1 = textApi.setSelectionRange(newSelectionRange);
    const selectedText = state1.selectedText;
    const hasDecoratorsValue = hasDecorators(initialState.text, newSelectionRange.start, newSelectionRange.end, '**');
    if (hasDecoratorsValue) {
      state1 = textApi.setSelectionRange({
          start: newSelectionRange.start - 2,
          end: newSelectionRange.end + 2,
        });
      // Removes the bold mark up
      const state2 = textApi.replaceSelection(selectedText)
         // Adjust the selection maintaining the original selection range
         textApi.setSelectionRange({
          start: state2.selection.end - selectedText.length,
          end: state2.selection.end,
        });
    } else {
      // Replaces the current selection with the bold mark up
      const state2 = textApi.replaceSelection(`**${selectedText}**`);
      // Adjust the selection to not contain the **
      textApi.setSelectionRange({
        start: state2.selection.end - 2 - state1.selectedText.length,
        end: state2.selection.end - 2,
      });
    }
  }, []);

  useEffect(() => {
    registerEventHandler({
      filter: (e) => {
        const { ctrlKey, metaKey, key } =
          e as React.KeyboardEvent<HTMLTextAreaElement>;
        return (ctrlKey || metaKey) && key === 'b';
      },
      handler: () => {
        onClick();
        return true;
      },
    });
  }, [onClick]);

  return (
    <ToolbarButton
      name="bold"
      aria-label="Add bold text"
      onClick={onClick}
      aria-pressed={pressed}
      className={pressed ? 'toolbarButton active' : 'toolbarButton'}>
      {getIcon('bold')}
    </ToolbarButton>
  );
};

export default BoldCommand;
