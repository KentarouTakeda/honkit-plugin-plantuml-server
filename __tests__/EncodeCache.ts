import { createHash } from 'crypto';
import { encode } from 'plantuml-encoder';
import { PlantUMLServer } from '../src/PlantUMLServer';

describe('PlantUMLServer', () => {
  const svg = Buffer.from(
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg>DUMMY DATA</svg>',
  );
  let request: jest.SpyInstance<ReturnType<PlantUMLServer['request']>> | null;
  let writeFile: jest.SpyInstance<
    ReturnType<PlantUMLServer['writeFile']>
  > | null;
  let readFile: jest.SpyInstance<ReturnType<PlantUMLServer['readFile']>> | null;
  let makeCacheDirectory: jest.SpyInstance<
    ReturnType<PlantUMLServer['makeCacheDirectory']>
  > | null;

  beforeEach(() => {
    request = jest
      .spyOn(PlantUMLServer.prototype, 'request')
      .mockReturnValue(Promise.resolve(svg));
    writeFile = jest
      .spyOn(PlantUMLServer.prototype, 'writeFile')
      .mockReturnValue(Promise.resolve(undefined));
    readFile = jest
      .spyOn(PlantUMLServer.prototype, 'readFile')
      .mockReturnValue(Promise.resolve(null));
    makeCacheDirectory = jest
      .spyOn(PlantUMLServer.prototype, 'makeCacheDirectory')
      .mockReturnValue(Promise.resolve());
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generate()', () => {
    it('Request the entered uml to the server and return the response as is.', async () => {
      const plantUMLServer = new PlantUMLServer({
        server: 'foo',
        format: 'svg',
        cacheDir: null,
        cssClass: 'bar',
      });
      const actual = await plantUMLServer.generate('Bob -> Alice : Hello!');
      expect(actual).toBe(svg);
    });

    it('Request only once if same uml is entered multiple times', async () => {
      const plantUMLServer = new PlantUMLServer({
        server: 'foo',
        format: 'svg',
        cacheDir: null,
        cssClass: 'bar',
      });
      const once = await plantUMLServer.generate('Bob -> Alice : Hello!');
      const twice = await plantUMLServer.generate('Bob -> Alice : Hello!');

      expect(once).toBe(svg);
      expect(twice).toBe(svg);
      expect(request).toBeCalledTimes(1);
    });

    it('If different UML is entered, request that number of times.', async () => {
      const plantUMLServer = new PlantUMLServer({
        server: 'foo',
        format: 'svg',
        cacheDir: null,
        cssClass: 'bar',
      });
      const twice = await plantUMLServer.generate('Bob -> Alice : Hello!');
      const once = await plantUMLServer.generate('Alice ->  Bob: Hi!');

      expect(once).toBe(svg);
      expect(twice).toBe(svg);
      expect(request).toBeCalledTimes(2);
    });
  });

  describe('request()', () => {
    it('The destination URL will be determined according to the config value.', async () => {
      const plantUMLServer = new PlantUMLServer({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: null,
        cssClass: 'bar',
      });
      const uml = 'Bob -> Alice : Hello!';
      const encoded = encode(uml);

      await plantUMLServer.generate(uml);
      expect(request).toBeCalledWith('http://test.invalid/svg/' + encoded);
    });
  });

  describe('writeCache', () => {
    it('Conversion results are cached in the file system using the hash of the uml document as a key', async () => {
      const plantUMLServer = new PlantUMLServer({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: '/path/to/cache',
        cssClass: 'bar',
      });
      const uml = 'Bob -> Alice : Hello!';
      const hash = createHash('sha1').update(uml).digest('hex');

      await plantUMLServer.generate(uml);
      await plantUMLServer.writeCache();
      expect(writeFile).toBeCalledWith(
        '/path/to/cache/honkit-plugin-plantuml-server-' + hash + '.svg',
        svg,
      );
      expect(writeFile).toBeCalledTimes(1);
      expect(makeCacheDirectory).toBeCalledTimes(1);
    });

    it('If `cacheDir` is not set, conversion results will not be cached.', async () => {
      const plantUMLServer = new PlantUMLServer({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: null,
        cssClass: 'bar',
      });
      const uml = 'Bob -> Alice : Hello!';
      const hash = createHash('sha1').update(uml).digest('hex');

      await plantUMLServer.generate(uml);
      await plantUMLServer.writeCache();
      expect(writeFile).not.toBeCalled();
      expect(makeCacheDirectory).not.toBeCalled();
    });
  });

  describe('readFile', () => {
    it('TODO', async () => {
      readFile!.mockReturnValue(Promise.resolve(Buffer.from('foo')));
      const plantUMLServer = new PlantUMLServer({
        server: 'http://test.invalid',
        format: 'svg',
        cacheDir: null,
        cssClass: 'bar',
      });
      const uml = 'Bob -> Alice : Hello!';
      await plantUMLServer.generate(uml);

      expect(request).not.toHaveBeenCalled();
    });
  });
});
