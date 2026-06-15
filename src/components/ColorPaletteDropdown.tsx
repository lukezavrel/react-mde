import * as React from 'react';
import { COLORS_PER_ROW, EDITOR_COLORS } from '../constants/colors.js';
import { ToolbarDropdown } from './ToolbarDropdown.js';

export type ColorPaletteDropdownProps = {
  icon: React.ReactNode;
  active: boolean;
  currentColor?: string;
  ariaLabel: string;
  defaultColorLabel: string;
  onSelect: (color: string | null) => void;
};

export const ColorPaletteDropdown = (props: ColorPaletteDropdownProps) => {
  const { icon, active, currentColor, ariaLabel, defaultColorLabel, onSelect } = props;
  const normalizedCurrent = currentColor?.toLowerCase();

  const rows: string[][] = [];
  for (let i = 0; i < EDITOR_COLORS.length; i += COLORS_PER_ROW) {
    rows.push(EDITOR_COLORS.slice(i, i + COLORS_PER_ROW) as unknown as string[]);
  }

  return (
    <ToolbarDropdown dropdownContent={icon} active={active} readOnly={false}>
      {(close) => (
        <div className="mde-color-palette" style={{ width: 'max-content' }}>
          <button
            type="button"
            className="mde-color-default"
            aria-label={defaultColorLabel}
            onClick={() => {
              onSelect(null);
              close();
            }}>
            {defaultColorLabel}
          </button>
          {rows.map((row, rowIndex) => (
            <div className="mde-color-row" key={rowIndex}>
              {row.map((color) => {
                const selected = normalizedCurrent === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    className={
                      selected ? 'mde-color-swatch selected' : 'mde-color-swatch'
                    }
                    style={{ backgroundColor: color, margin: '2px', height: '16px', width: '16px' }}
                    aria-label={color}
                    aria-pressed={selected}
                    onClick={() => {
                      onSelect(color);
                      close();
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </ToolbarDropdown>
  );
};

export default ColorPaletteDropdown;
