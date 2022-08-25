import { readFile } from 'fs/promises';
import { maktHtml, replaceCodeBlock } from '../src/libs';

describe('replaceCodeBlock', () => {
  it('If plain text is input, return it as is', async () => {
    const actual = await replaceCodeBlock('foo');
    expect(actual).toBe('foo');
  });

  it('If a code block that is not uml is entered, return it as it is', async () => {
    const markdown = await readFile(__dirname + '/files/no-uml.md', 'utf-8');
    const actual = replaceCodeBlock(markdown);
    expect(actual).toBe(markdown);
  });

  it('Convert to block when uml is input', async () => {
    const markdown = await readFile(
      __dirname + '/files/uml-original.md',
      'utf-8',
    );
    const expected = await readFile(
      __dirname + '/files/uml-converted.md',
      'utf-8',
    );
    const actual = replaceCodeBlock(markdown);
    expect(actual).toBe(expected);
  });
});

describe('maktHtml', () => {
  it('Svg data will be converted to figure and img tags', () => {
    const expected =
      '<figure><img src="data:image/svg+xml;base64,U1ZHIERBVEE="></figure>';
    const actual = maktHtml('SVG DATA', 'image/svg+xml');

    expect(actual).toBe(expected);
  });
});
