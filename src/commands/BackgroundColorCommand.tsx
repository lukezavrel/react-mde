import * as React from 'react';
import { useCallback } from 'react';
import { ColorPaletteDropdown, useReactMde } from '../components/index.js';
import { applyInlineColor, getActiveBackgroundColor } from '../util/colorUtil.js';
import { getActiveInlineDecorators } from '../util/MarkdownUtil.js';

const BackgroundColorCommand = () => {
  const { getTextState, textApi, getIcon, l18n, selectionRevision } = useReactMde();
  void selectionRevision;
  const { text, selection } = getTextState();
  const active = getActiveInlineDecorators(text, selection).some(
    (d) => d.kind === 'backgroundColor',
  );
  const currentColor = getActiveBackgroundColor(text, selection);

  const onSelect = useCallback(
    (color: string | null) => {
      applyInlineColor(getTextState, textApi, {
        property: 'background-color',
        value: color,
      });
    },
    [getTextState, textApi],
  );

  return (
    <ColorPaletteDropdown
      icon={getIcon('background-color', { color: currentColor })}
      active={active}
      currentColor={currentColor}
      ariaLabel={l18n.backgroundColor ?? 'Background color'}
      defaultColorLabel={l18n.defaultBackgroundColor ?? 'Default'}
      onSelect={onSelect}
    />
  );
};

export default BackgroundColorCommand;
