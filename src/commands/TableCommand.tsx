import * as React from 'react';
import { useCallback, useState } from 'react';
import { ToolbarDropdown, useReactMde } from '../components/index.js';

const TableCommand = () => {
  const { getTextState, textApi, getIcon, l18n } =
    useReactMde();
  const [tableColumns, setTableColumns] = useState(5);
  const [tableRows, setTableRows] = useState(5);
  const [highlightedColumns, setHighlightedColumns] = useState(0);
  const [highlightedRows, setHighlightedRows] = useState(0);

  const onClick = useCallback(({rows, cols}: {rows: number, cols: number}) => {
    const initialState = getTextState();
    let state1 = textApi.setSelectionRange(initialState.selection);
    let headerText = 'header';
    const headers = '| ' + Array.from({ length: cols }, (_, colIndex) => headerText).join(' | ') + ' |';
    const dividers = '| ' + Array.from({ length: cols }, (_, colIndex) => '-'.repeat(headerText.length)).join(' | ') + ' |' ;
    const cells = Array.from({ length: rows }, (_, rowIndex) => '| ' + Array.from({ length: cols }, (_, colIndex) => ' '.repeat(headerText.length)).join(' | ') + ' |').join('\n');
    const text = `\n${headers}\n${dividers}\n${cells}`;
    const state2 = textApi.replaceSelection(text);
    textApi.setSelectionRange({
      start: state2.selection.end,
      end: state2.selection.end,
    });
  }, []);

  const onMouseEnter = ({rows, cols}: {rows: number, cols: number}) => {
    setHighlightedColumns(cols);
    setHighlightedRows(rows);
    if (rows === tableRows && rows < 10) {
        setTableRows(rows + 1);
    }
    if (cols === tableColumns && cols < 10) {
        setTableColumns(cols + 1);
    }
  };

  return (
    <ToolbarDropdown dropdownContent={getIcon('table')} active={false} readOnly={false}>
      {(close) => (
        <div style={{ width: 'max-content' }}>
          {Array.from({ length: tableRows }, (_, rowIndex) => (
            <div key={rowIndex}>
              {Array.from({ length: tableColumns }, (_, colIndex) => (
                <div
                  className={
                    'table-cell' +
                    (highlightedColumns >= colIndex + 1 && highlightedRows >= rowIndex + 1
                      ? ' highlighted'
                      : '')
                  }
                  key={colIndex}
                  onMouseEnter={() => onMouseEnter({ rows: rowIndex + 1, cols: colIndex + 1 })}
                  onClick={() => {
                    onClick({ rows: rowIndex + 1, cols: colIndex + 1 });
                    close();
                  }}
                />
              ))}
            </div>
          ))}
          <div className="table-insert-info">
            {l18n.tableInsertInfoStart} {highlightedRows}x{highlightedColumns}{' '}
            {l18n.tableInsertInfoEnd}
          </div>
        </div>
      )}
    </ToolbarDropdown>
  );
};

export default TableCommand;
