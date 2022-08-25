import { createHash } from 'crypto';
import { encode } from 'plantuml-encoder';
import { EncodeCache } from '../src/EncodeCache';
jest.mock('fs/promises');

describe('EncodeCache', () => {
  const svg =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg>DUMMY DATA</svg>';
  let request: jest.SpyInstance<ReturnType<EncodeCache['request']>> | null;
  let writeFile: jest.SpyInstance<ReturnType<EncodeCache['writeFile']>> | null;
  let readFile: jest.SpyInstance<ReturnType<EncodeCache['readFile']>> | null;
  let makeCacheDirectory: jest.SpyInstance<
    ReturnType<EncodeCache['makeCacheDirectory']>
  > | null;

  beforeEach(() => {
    request = jest
      .spyOn(EncodeCache.prototype, 'request')
      .mockReturnValue(Promise.resolve(svg));
    writeFile = jest
      .spyOn(EncodeCache.prototype, 'writeFile')
      .mockReturnValue(Promise.resolve());
    readFile = jest
      .spyOn(EncodeCache.prototype, 'readFile')
      .mockReturnValue(Promise.resolve(null));
    makeCacheDirectory = jest
      .spyOn(EncodeCache.prototype, 'makeCacheDirectory')
      .mockReturnValue(Promise.resolve());
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generate()', () => {
    it('Request the entered uml to the server and return the response as is.', async () => {
      const encodeCache = new EncodeCache({
        server: 'foo',
        format: 'svg',
        cacheDir: null,
      });
      const actual = await encodeCache.generate('Bob -> Alice : Hello!');
      expect(actual).toBe(svg);
    });

    it('Request only once if same uml is entered multiple times', async () => {
      const encodeCache = new EncodeCache({
        server: 'foo',
        format: 'svg',
        cacheDir: null,
      });
      const once = await encodeCache.generate('Bob -> Alice : Hello!');
      const twice = await encodeCache.generate('Bob -> Alice : Hello!');

      expect(once).toBe(svg);
      expect(twice).toBe(svg);
      expect(request).toBeCalledTimes(1);
    });

    it('If different UML is entered, request that number of times.', async () => {
      const encodeCache = new EncodeCache({
        server: 'foo',
        format: 'svg',
        cacheDir: null,
      });
      const twice = await encodeCache.generate('Bob -> Alice : Hello!');
      const once = await encodeCache.generate('Alice ->  Bob: Hi!');

      expect(once).toBe(svg);
      expect(twice).toBe(svg);
      expect(request).toBeCalledTimes(2);
    });
  });

  describe('request()', () => {
    it('The destination URL will be determined according to the config value.', async () => {
      const encodeCache = new EncodeCache({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: null,
      });
      const uml = 'Bob -> Alice : Hello!';
      const encoded = encode(uml);

      await encodeCache.generate(uml);
      expect(request).toBeCalledWith('http://test.invalid/svg/' + encoded);
    });
  });

  describe('writeCache', () => {
    it('Conversion results are cached in the file system using the hash of the uml document as a key', async () => {
      const encodeCache = new EncodeCache({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: '/path/to/cache',
      });
      const uml = 'Bob -> Alice : Hello!';
      const hash = createHash('sha1').update(uml).digest('hex');

      await encodeCache.generate(uml);
      await encodeCache.writeCache();
      expect(writeFile).toBeCalledWith(
        '/path/to/cache/honkit-plugin-plantuml-server-' + hash + '.svg',
        svg,
      );
      expect(writeFile).toBeCalledTimes(1);
      expect(makeCacheDirectory).toBeCalledTimes(1);
    });

    it('If `cacheDir` is not set, conversion results will not be cached.', async () => {
      const encodeCache = new EncodeCache({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: null,
      });
      const uml = 'Bob -> Alice : Hello!';
      const hash = createHash('sha1').update(uml).digest('hex');

      await encodeCache.generate(uml);
      await encodeCache.writeCache();
      expect(writeFile).not.toBeCalled();
      expect(makeCacheDirectory).not.toBeCalled();
    });
  });

  describe('readFile', () => {
    it('TODO', async () => {
      readFile!.mockReturnValue(Promise.resolve('foo'));
      const encodeCache = new EncodeCache({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: null,
      });
      const uml = 'Bob -> Alice : Hello!';
      await encodeCache.generate(uml);

      expect(request).not.toHaveBeenCalled();
    });
  });
});
