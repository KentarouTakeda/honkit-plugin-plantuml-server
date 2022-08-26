import { tmpdir } from 'os';
import { EncodeCache, config, mimes } from './EncodeCache';
import { makeHtml, replaceCodeBlock } from './libs';

const defaultConfig: config = {
  server: 'http://www.plantuml.com/plantuml/',
  format: 'svg',
  cacheDir: tmpdir(),
};

let encodeCache: EncodeCache;

export const hooks = {
  init: function (this: any) {
    const config = Object.assign(
      defaultConfig,
      this.config.get('pluginsConfig.plantuml-server'),
    );

    if (true !== Object.keys(mimes).includes(config.format)) {
      throw new Error(`plantuml-server: invalid format "${config.format}"`);
    }

    encodeCache = new EncodeCache(config);
    encodeCache.on('process:start', (hash) =>
      this.log.info(`plantuml-server: converting: ${hash}`),
    );
    encodeCache.on('process:memory', (hash) =>
      this.log.info(`plantuml-server: converted from memoty: ${hash}`),
    );
    encodeCache.on('process:cache', (hash) =>
      this.log.info(`plantuml-server: converted from cache: ${hash}`),
    );
    encodeCache.on('process:server', (hash) =>
      this.log.info(`plantuml-server: converted from server: ${hash}`),
    );
    encodeCache.on('cache:write', (fileName) =>
      this.log.info(`plantuml-server: write cache: ${fileName}`),
    );
    encodeCache.on('cache:error', (fileName) =>
      this.log.warn(`plantuml-server: unnable to write cache: ${fileName}`),
    );
  },

  'page:before': (page: { content: string }) => {
    page.content = replaceCodeBlock(page.content);
    return page;
  },

  'finish:before': () => encodeCache.writeCache(),
};

export const blocks = {
  uml: async (block: { body: string }) => {
    const converted = await encodeCache.generate(block.body);
    const tag = makeHtml(converted, encodeCache.mime());
    return tag;
  },
};
