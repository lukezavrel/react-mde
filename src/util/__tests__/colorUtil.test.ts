import {
  applyInlineColor,
  buildStyleSpanOpen,
  findStyleSpanContaining,
  getActiveBackgroundColor,
  getActiveTextColor,
  parseStyleSpanOpenTag,
  STYLE_SPAN_CLOSE,
} from '../colorUtil';
import { getActiveInlineDecorators } from '../MarkdownUtil';

function createMockTextApi(initialText: string, selection: { start: number; end: number }) {
  let text = initialText;
  let sel = { ...selection };
  const getTextState = () => ({
    text,
    selectedText: text.slice(sel.start, sel.end),
    selection: { ...sel },
  });
  const textApi = {
    replaceSelection: (newText: string) => {
      text = text.slice(0, sel.start) + newText + text.slice(sel.end);
      const newEnd = sel.start + newText.length;
      sel = { start: newEnd, end: newEnd };
      return getTextState();
    },
    setSelectionRange: (selection: { start: number; end: number }) => {
      sel = { ...selection };
      return getTextState();
    },
    getState: getTextState,
  };
  return { getTextState, textApi, getText: () => text };
}

describe('colorUtil', () => {
  describe('parseStyleSpanOpenTag', () => {
    it('parses color and background-color', () => {
      expect(
        parseStyleSpanOpenTag('<span style="color:#cc2c32;background-color:#facccc">'),
      ).toEqual({
        color: '#cc2c32',
        backgroundColor: '#facccc',
      });
    });
  });

  describe('buildStyleSpanOpen', () => {
    it('builds combined style span', () => {
      expect(
        buildStyleSpanOpen({ color: '#cc2c32', backgroundColor: '#facccc' }),
      ).toBe('<span style="color:#cc2c32;background-color:#facccc">');
    });
  });

  describe('findStyleSpanContaining', () => {
    it('finds span when caret is inside colored text', () => {
      const text = '<span style="color:#cc2c32">hello</span>';
      const caret = text.indexOf('hello') + 2;
      const match = findStyleSpanContaining(text, { start: caret, end: caret });
      expect(match?.styles.color).toBe('#cc2c32');
      expect(text.slice(match!.content.start, match!.content.end)).toBe('hello');
    });

    it('finds innermost span when nested', () => {
      const text =
        '<span style="color:#cc2c32"><span style="background-color:#facccc">x</span></span>';
      const caret = text.indexOf('x');
      const match = findStyleSpanContaining(text, { start: caret, end: caret });
      expect(match?.styles.backgroundColor).toBe('#facccc');
    });
  });

  describe('getActiveTextColor / getActiveBackgroundColor', () => {
    it('returns active colors from span', () => {
      const text = '<span style="color:#cc2c32;background-color:#facccc">hi</span>';
      const caret = text.indexOf('h');
      expect(getActiveTextColor(text, { start: caret, end: caret })).toBe('#cc2c32');
      expect(getActiveBackgroundColor(text, { start: caret, end: caret })).toBe(
        '#facccc',
      );
    });
  });

  describe('applyInlineColor', () => {
    it('wraps plain selection with color span', () => {
      const text = 'hello world';
      const start = 0;
      const end = 5;
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start,
        end,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: '#cc2c32',
      });
      expect(getText()).toBe(
        '<span style="color:#cc2c32">hello</span> world',
      );
    });

    it('updates color on existing span without extra nesting', () => {
      const text = '<span style="color:#cc2c32">hello</span>';
      const caret = text.indexOf('h');
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: caret,
        end: caret,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: '#0066cc',
      });
      expect(getText()).toBe('<span style="color:#0066cc">hello</span>');
    });

    it('merges background color onto existing color span', () => {
      const text = '<span style="color:#cc2c32">hello</span>';
      const caret = text.indexOf('h');
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: caret,
        end: caret,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'background-color',
        value: '#facccc',
      });
      expect(getText()).toBe(
        '<span style="color:#cc2c32;background-color:#facccc">hello</span>',
      );
    });

    it('removes text color while keeping background color', () => {
      const text =
        '<span style="color:#cc2c32;background-color:#facccc">hello</span>';
      const caret = text.indexOf('h');
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: caret,
        end: caret,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: null,
      });
      expect(getText()).toBe(
        '<span style="background-color:#facccc">hello</span>',
      );
    });

    it('unwraps span when removing the only style', () => {
      const text = '<span style="color:#cc2c32">hello</span>';
      const caret = text.indexOf('h');
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: caret,
        end: caret,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: null,
      });
      expect(getText()).toBe('hello');
    });

    it('does nothing when removing color from plain text', () => {
      const text = 'hello';
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: 1,
        end: 1,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: null,
      });
      expect(getText()).toBe('hello');
    });

    it('changes color only on partial selection inside styled span', () => {
      const text =
        '<span style="color:#000000;background-color:#ffc266">Hello world</span>';
      const helloStart = text.indexOf('Hello');
      const helloEnd = helloStart + 'Hello'.length;
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: helloStart,
        end: helloEnd,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: '#cc2c32',
      });
      expect(getText()).toBe(
        '<span style="color:#cc2c32;background-color:#ffc266">Hello</span><span style="color:#000000;background-color:#ffc266"> world</span>',
      );
    });

    it('removes color only on partial selection inside styled span', () => {
      const text =
        '<span style="color:#000000;background-color:#ffc266">Hello world</span>';
      const helloStart = text.indexOf('Hello');
      const helloEnd = helloStart + 'Hello'.length;
      const { getTextState, textApi, getText } = createMockTextApi(text, {
        start: helloStart,
        end: helloEnd,
      });
      applyInlineColor(getTextState, textApi, {
        property: 'color',
        value: null,
      });
      expect(getText()).toBe(
        '<span style="background-color:#ffc266">Hello</span><span style="color:#000000;background-color:#ffc266"> world</span>',
      );
    });
  });
});

describe('MarkdownUtil color decorators', () => {
  it('returns textColor and backgroundColor kinds for combined span', () => {
    const text = '<span style="color:#cc2c32;background-color:#facccc">hi</span>';
    const caret = text.indexOf('h');
    const kinds = getActiveInlineDecorators(text, { start: caret, end: caret }).map(
      (d) => d.kind,
    );
    expect(kinds.sort()).toEqual(['backgroundColor', 'textColor']);
  });

  it('uses STYLE_SPAN_CLOSE length consistently', () => {
    expect(STYLE_SPAN_CLOSE).toBe('</span>');
  });
});
