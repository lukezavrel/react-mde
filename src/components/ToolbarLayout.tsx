import * as React from 'react';
import { ToolbarButtonGroup } from './ToolbarButtonGroup.js';
import {
  BoldCommand,
  Header3Command,
  ItalicCommand,
  LinkCommand,
  CodeCommand,
  ImageCommand,
  QuoteCommand,
  OrderedListCommand,
  UnorderedListCommand,
  CheckedListCommand,
  StrikethroughCommand,
  TableCommand,
  TextAlignCommands,
  TextColorCommand,
  BackgroundColorCommand,
} from '../commands/index.js';
import ToggleMaximizeCommand from '../commands/ToggleMaximizeCommand.js';
import { useReactMde } from './ReactMdeContext.js';

export const ToolbarLayout = (props: { beforeSpacer?: any, afterSpacer?: any }) => {
  const { beforeSpacer, afterSpacer } = props;
  const { disableMaximize, enableTextColor, enableBackgroundColor } = useReactMde();
  return (
    <>
      <ToolbarButtonGroup key="font">
        <Header3Command />
        <BoldCommand />
        <ItalicCommand />
        <StrikethroughCommand />
        <TextAlignCommands />
        {enableTextColor && <TextColorCommand />}
        {enableBackgroundColor && <BackgroundColorCommand />}
      </ToolbarButtonGroup>
      <ToolbarButtonGroup key="special">
        <LinkCommand />
        <QuoteCommand />
        <CodeCommand />
        <ImageCommand />
        <TableCommand />
      </ToolbarButtonGroup>
      <ToolbarButtonGroup key="lists">
        <UnorderedListCommand />
        <OrderedListCommand />
        <CheckedListCommand />
      </ToolbarButtonGroup>
      {beforeSpacer}
      {/* <ul className='spacer' /> */}
      {afterSpacer}
      {!disableMaximize && (
        <ul className="maximizeRight">
          <ToggleMaximizeCommand />
        </ul>
      )}
    </>
  );
};

export default ToolbarLayout;
