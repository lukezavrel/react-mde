import * as React from 'react';
import { useState, useEffect, useRef } from 'react';

export type ToolbarDropdownChildren =
  | React.ReactNode
  | ((closeDropdown: () => void) => React.ReactNode);

export type ToolbarDropdownProps = {
  dropdownContent: React.ReactNode;
  readOnly: boolean;
  children: ToolbarDropdownChildren;
};

export const ToolbarDropdown = (props: ToolbarDropdownProps) => {
  const { readOnly, dropdownContent, children } = props;
  const dropdown = useRef<any>(null);
  const dropdownOpener = useRef<any>(null);
  const [open, setOpen] = useState(false);

  const openDropdown = () => {
    setOpen(true);
  };

  const closeDropdown = () => {
    setOpen(false);
  };

  const clickedOutside = (e: Event) => {
    const { target } = e;
    return (
      dropdown.current &&
      dropdownOpener.current &&
      !dropdown.current.contains(target) &&
      !dropdownOpener.current.contains(target)
    );
  };

  const handleGlobalClick = (e: Event) => {
    if (clickedOutside(e)) {
      closeDropdown();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick, false);
    return () => {
      document.removeEventListener('click', handleGlobalClick, false);
    };
  }, []);

  const renderDropdownBody = () => {
    if (typeof children === 'function') {
      return (children as (close: () => void) => React.ReactNode)(closeDropdown);
    }
    return children;
  };

  const handleClick = () => {
    if (!open) {
      openDropdown();
    } else {
      closeDropdown();
    }
  };

  const dropdownItems = open ? (
    <ul className="mde-header-dropdown-items" ref={dropdown}>
      {renderDropdownBody()}
    </ul>
  ) : null;

  return (
    <li className="mde-header-dropdown">
      <button
        className="toolbarButton"
        type="button"
        tabIndex={-1}
        ref={dropdownOpener}
        onClick={handleClick}
        disabled={readOnly}>
        {dropdownContent}
      </button>
      {dropdownItems}
    </li>
  );
};
