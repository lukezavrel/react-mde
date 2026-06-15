import * as React from 'react';
import { useCallback } from 'react';
import { ColorPaletteDropdown, useReactMde } from '../components/index.js';
import { applyInlineColor, getActiveTextColor } from '../util/colorUtil.js';
import { getActiveInlineDecorators } from '../util/MarkdownUtil.js';

const TextColorCommand = () => {
  const { getTextState, textApi, getIcon, l18n, selectionRevision } = useReactMde();
  void selectionRevision;
  const { text, selection } = getTextState();
  const active = getActiveInlineDecorators(text, selection).some(
    (d) => d.kind === 'textColor',
  );
  const currentColor = getActiveTextColor(text, selection);

  const onSelect = useCallback(
    (color: string | null) => {
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: color,
      });
    },
    [getTextState, textApi],
  );

  return (
    <ColorPaletteDropdown
      icon={getIcon('text-color', { color: currentColor })}
      active={active}
      currentColor={currentColor}
      ariaLabel={l18n.textColor ?? 'Text color'}
      defaultColorLabel={l18n.defaultColor ?? 'Default'}
      onSelect={onSelect}
    />
  );
};

export default TextColorCommand;
