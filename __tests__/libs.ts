import fs from 'fs';
import {
  convertUmlSrcToAbsolute,
  makeHtml,
  replaceCodeBlock,
} from '../src/libs';

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

describe('convertUmlSrcToAbsolute', () => {
  it('Relative path will be converted to absolute path', () => {
    const actual = convertUmlSrcToAbsolute(
      `{% uml src="path/to/uml" %}`,
      '/srcBase',
      'srcPath/file',
    );
    const expected = `{% uml src="/srcBase/srcPath/path/to/uml" %}`;

    expect(actual).toBe(expected);
  });

  it('Multiple tags will all be converted', () => {
    const actual = convertUmlSrcToAbsolute(
      `{% uml src="hoge" %}{% enduml %}{% uml src="fuga" %}{% enduml %}`,
      '/srcBase',
      'srcPath/file',
    );
    const expected = `{% uml src="/srcBase/srcPath/hoge" %}{% enduml %}{% uml src="/srcBase/srcPath/fuga" %}{% enduml %}`;

    expect(actual).toBe(expected);
  });

  it('tags containing newlines will be converted', () => {
    const actual = convertUmlSrcToAbsolute(
      `
      {%
        uml
        src="path/to/uml"
      %}
    `,
      '/srcBase',
      'srcPath/file',
    );
    const expected = `
      {%
        uml
        src="/srcBase/srcPath/path/to/uml"
      %}
    `;

    expect(actual).toBe(expected);
  });

  it('Incomplete tags will not be converted', () => {
    const actual = convertUmlSrcToAbsolute(
      `{% uml src="path/to/uml" `,
      '/srcBase',
      'srcPath/file',
    );
    const expected = `{% uml src="path/to/uml" `;

    expect(actual).toBe(expected);
  });

  it('Absolute paths will not be converted', () => {
    const actual = convertUmlSrcToAbsolute(
      `{% uml src="/path/to/uml" %}`,
      '/srcBase',
      'srcPath/file',
    );
    const expected = `{% uml src="/srcBase/path/to/uml" %}`;

    expect(actual).toBe(expected);
  });

  it('Tags other than `uml` will not be converted', () => {
    const actual = convertUmlSrcToAbsolute(
      `{% hoge src="path/to/uml" %}`,
      '/srcBase',
      'srcPath/file',
    );
    const expected = `{% hoge src="path/to/uml" %}`;

    expect(actual).toBe(expected);
  });
});
