import * as React from 'react';
import { ToolbarButton, useReactMde } from '../components/index.js';
import { selectWord } from '../util/MarkdownUtil.js';

const ImageCommand = () => {
  const { getTextState, textApi, getIcon } = useReactMde();

  return (
    <ToolbarButton
      name="image"
      aria-label="Add image"
      onClick={() => {
        const initialState = getTextState();
        // Adjust the selection to encompass the whole word if the caret is inside one
        const newSelectionRange = selectWord({
          text: initialState.text,
          selection: initialState.selection,
        });
        const state1 = textApi.setSelectionRange(newSelectionRange);
        // Replaces the current selection with the image mark up
        const state2 = textApi.replaceSelection(`![${state1.selectedText}](imageUrl)`);
        // Adjust the selection to not contain the [](imageUrl)
        textApi.setSelectionRange({
          start: state2.selection.end - 11 - state1.selectedText.length,
          end: state2.selection.end - 11,
        });
      }}>
      {getIcon('image')}
    </ToolbarButton>
  );
};

export default ImageCommand;
