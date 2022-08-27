import fs from 'fs';
import { makeHtml, replaceCodeBlock } from '../src/libs';

describe('replaceCodeBlock', () => {
  it('If plain text is input, return it as is', async () => {
    const actual = await replaceCodeBlock('foo');
    expect(actual).toBe('foo');
  });

  it('If a code block that is not uml is entered, return it as it is', async () => {
    const markdown = await fs.promises.readFile(
      __dirname + '/files/no-uml.md',
      'utf-8',
    );
    const actual = replaceCodeBlock(markdown);
    expect(actual).toBe(markdown);
  });

  it('Convert to block when uml is input', async () => {
    const markdown = await fs.promises.readFile(
      __dirname + '/files/uml-original.md',
      'utf-8',
    );
    const expected = await fs.promises.readFile(
      __dirname + '/files/uml-converted.md',
      'utf-8',
    );
    const actual = replaceCodeBlock(markdown);
    expect(actual).toBe(expected);
  });
});

describe('makeHtml', () => {
  it('Svg data will be converted to figure and img tags', () => {
    const expected =
      '<figure class="foo"><img src="data:image/svg+xml;base64,U1ZHIERBVEE="></figure>';
    const actual = makeHtml(Buffer.from('SVG DATA'), 'image/svg+xml', 'foo');

    expect(actual).toBe(expected);
  });
});
