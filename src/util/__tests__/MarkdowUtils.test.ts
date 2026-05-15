import { getSurroundingWord, getActiveInlineDecorator, getActiveInlineDecorators } from '../MarkdownUtil';

describe('MarkdownUtil', () => {
  describe('getSurroundingWord', () => {
    it('Basic usage', () => {
      const result = getSurroundingWord('bob went to school', 5);
      expect(result).toEqual({ end: 8, start: 4 });
    });
    it('TextSection edge to the right', () => {
      const result = getSurroundingWord('bob went to school', 8);
      expect(result).toEqual({
        end: 8,
        start: 4,
      });
    });
    it('TextSection edge to the left', () => {
      const result = getSurroundingWord('bob went to school', 4);
      expect(result).toEqual({
        end: 8,
        start: 4,
      });
    });
    it('text beginning', () => {
      const result = getSurroundingWord('bob went to school', 0);
      expect(result).toEqual({
        end: 3,
        start: 0,
      });
    });
    it('text ending', () => {
      const result = getSurroundingWord('bob went to school', 18);
      expect(result).toEqual({ end: 18, start: 12 });
    });
    it('Basic usage with line breaks', () => {
      const result = getSurroundingWord('bob\nwent\nto school', 5);
      expect(result).toEqual({
        start: 4,
        end: 8,
      });
    });
    it('text ending with line break', () => {
      const result = getSurroundingWord('bob went to school\n', 18);
      expect(result).toEqual({
        start: 12,
        end: 18,
      });
    });
    it('text beginning with line break', () => {
      const result = getSurroundingWord('\nbob went to school', 1);
      expect(result).toEqual({
        start: 1,
        end: 4,
      });
    });
    it('within spaces', () => {
      const result = getSurroundingWord('   ', 1);
      expect(result).toEqual({
        start: 1,
        end: 1,
      });
    });
    it('within spaces 2', () => {
      const result = getSurroundingWord('   ', 2);
      expect(result).toEqual({
        start: 2,
        end: 2,
      });
    });
    it('within line-breaks', () => {
      const result = getSurroundingWord('\n\n\n', 1);
      expect(result).toEqual({
        start: 1,
        end: 1,
      });
    });
  });

  describe('getActiveInlineDecorator', () => {
    it('returns bold when caret is inside ** content', () => {
      const text = '**foo**';
      const r = getActiveInlineDecorator(text, { start: 4, end: 4 });
      expect(r?.kind).toBe('bold');
      expect(r?.content).toEqual({ start: 2, end: 5 });
      expect(r?.open).toEqual({ start: 0, end: 2 });
      expect(r?.close).toEqual({ start: 5, end: 7 });
    });

    it('returns null when caret is on opening bold delimiter', () => {
      const text = '**foo**';
      expect(getActiveInlineDecorator(text, { start: 1, end: 1 })).toBeNull();
    });

    it('returns bold when caret is after last inner char before closing **', () => {
      const text = '**foo**';
      expect(getActiveInlineDecorator(text, { start: 5, end: 5 })?.kind).toBe('bold');
      const world = '**world**';
      const afterD = world.indexOf('d') + 1;
      expect(getActiveInlineDecorator(world, { start: afterD, end: afterD })?.kind).toBe(
        'bold',
      );
    });

    it('returns bold for non-empty selection fully inside content', () => {
      const text = '**foobar**';
      const r = getActiveInlineDecorator(text, { start: 4, end: 7 });
      expect(r?.kind).toBe('bold');
    });

    it('returns null when selection overlaps closing **', () => {
      const text = '**foobar**';
      expect(getActiveInlineDecorator(text, { start: 4, end: 9 })).toBeNull();
    });

    it('prefers bold over italic when inside **', () => {
      const text = '**ab**';
      const r = getActiveInlineDecorator(text, { start: 3, end: 3 });
      expect(r?.kind).toBe('bold');
    });

    it('returns italic inside *foo*', () => {
      const text = '*foo*';
      const r = getActiveInlineDecorator(text, { start: 2, end: 2 });
      expect(r?.kind).toBe('italic');
      expect(r?.content).toEqual({ start: 1, end: 4 });
    });

    it('returns strikethrough inside ~~x~~', () => {
      const text = '~~bar~~';
      const r = getActiveInlineDecorator(text, { start: 4, end: 4 });
      expect(r?.kind).toBe('strikethrough');
      expect(r?.content).toEqual({ start: 2, end: 5 });
    });

    it('returns inlineCode for single-line backticks', () => {
      const text = '`a`';
      const r = getActiveInlineDecorator(text, { start: 1, end: 1 });
      expect(r?.kind).toBe('inlineCode');
      expect(r?.content).toEqual({ start: 1, end: 2 });
    });

    it('returns null for inline code when inner has newline', () => {
      const text = '`a\nb`';
      expect(getActiveInlineDecorator(text, { start: 2, end: 2 })).toBeNull();
    });

    it('returns null outside any decorator', () => {
      expect(getActiveInlineDecorator('plain', { start: 2, end: 2 })).toBeNull();
    });

    it('nested italic and bold: both kinds when caret inside inner bold', () => {
      const text = '*Hello **world**!!!*';
      const caret = text.indexOf('r');
      const dec = getActiveInlineDecorators(text, { start: caret, end: caret });
      const kinds = dec.map((d) => d.kind).sort();
      expect(kinds).toEqual(['bold', 'italic']);
      expect(getActiveInlineDecorator(text, { start: caret, end: caret })?.kind).toBe(
        'bold',
      );
    });

    it('triple asterisk ***...***: bold and italic when caret in inner text', () => {
      const text = '***Hello world!!!***';
      const caret = text.indexOf('r');
      const dec = getActiveInlineDecorators(text, { start: caret, end: caret });
      const kinds = dec.map((d) => d.kind).sort();
      expect(kinds).toEqual(['bold', 'italic']);
      expect(getActiveInlineDecorator(text, { start: caret, end: caret })?.kind).toBe(
        'bold',
      );
    });

    it('short ***asd***: bold and italic when caret inside asd', () => {
      const text = '***asd***';
      const caret = text.indexOf('s');
      const dec = getActiveInlineDecorators(text, { start: caret, end: caret });
      expect(dec.map((d) => d.kind).sort()).toEqual(['bold', 'italic']);
    });

    it('triple span embedded in line: bold and italic', () => {
      const text = 'Hi ***asd*** there';
      const caret = text.indexOf('s');
      const dec = getActiveInlineDecorators(text, { start: caret, end: caret });
      expect(dec.map((d) => d.kind).sort()).toEqual(['bold', 'italic']);
    });

    it('bold wrapping emph closed by ***: **Hello *world!!!***', () => {
      const text = '**Hello *world!!!***';
      const caret = text.indexOf('r');
      const dec = getActiveInlineDecorators(text, { start: caret, end: caret });
      expect(dec.map((d) => d.kind).sort()).toEqual(['bold', 'italic']);
    });

    it('detects text-align center inside <p style="text-align: center;">...</p>', () => {
      const text = '<p style="text-align: center;">Hi there</p>';
      const caret = text.indexOf('there') + 2;
      const dec = getActiveInlineDecorators(text, { start: caret, end: caret });
      expect(dec.some((d) => d.kind === 'textAlignCenter')).toBe(true);
      expect(getActiveInlineDecorator(text, { start: caret, end: caret })?.kind).toBe(
        'textAlignCenter',
      );
    });
  });
});
