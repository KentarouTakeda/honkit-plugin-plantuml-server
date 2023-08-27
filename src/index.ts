import assert from 'assert';
import { readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { PlantUMLServer, config as ClassConfig, mimes } from './PlantUMLServer';
import {
  convertUmlSrcToAbsolute,
  makeHtml,
  optimizeImage,
  replaceCodeBlock,
} from './libs';

const defaultConfig: PluginConfig = {
  server: 'http://www.plantuml.com/plantuml/',
  format: 'svg',
  cacheDir: tmpdir(),
  cssClass: 'plantuml',
  optimizeImage: true,
};

interface PluginConfig extends ClassConfig, LibConfig {}
interface LibConfig {
  optimizeImage: boolean;
}

let plantUMLServer: PlantUMLServer | null = null;
let libConfig: LibConfig | null = null;
let classConfig: ClassConfig | null = null;

export const hooks = {
  init: function (this: any) {
    const mergedConfig = Object.assign(
      {},
      defaultConfig,
      this.config.get('pluginsConfig.plantuml-server') as PluginConfig,
      // ebook-convert cannot handle svg format data-uri, so it is forced to change to png
      this.output.name === 'ebook' ? { format: 'png' } : {},
    );

    libConfig = {
      optimizeImage: mergedConfig.optimizeImage,
    };
    classConfig = {
      cacheDir: mergedConfig.cacheDir,
      cssClass: mergedConfig.cssClass,
      format: mergedConfig.format,
      server: mergedConfig.server,
    };

    if (true !== Object.keys(mimes).includes(classConfig.format)) {
      throw new Error(
        `plantuml-server: invalid format "${classConfig.format}"`,
      );
    }

    plantUMLServer = new PlantUMLServer(classConfig);
    plantUMLServer.on('process:start', (hash) =>
      this.log.info(`plantuml-server: converting: ${hash}\n`),
    );
    plantUMLServer.on('process:memory', (hash) =>
      this.log.info(`plantuml-server: converted from memory: ${hash}\n`),
    );
    plantUMLServer.on('process:cache', (hash) =>
      this.log.info(`plantuml-server: converted from cache: ${hash}\n`),
    );
    plantUMLServer.on('process:server', (hash) =>
      this.log.info(`plantuml-server: converted from server: ${hash}\n`),
    );
    plantUMLServer.on('process:server:error', (url, e) => {
      this.log.warn(`plantuml-server: server error: ${url}\n`);
      this.log.warn(e);
      this.log.warn('\n');
    });
    plantUMLServer.on('cache:write', (fileName) =>
      this.log.info(`plantuml-server: write cache: ${fileName}\n`),
    );
    plantUMLServer.on('cache:error', (fileName) =>
      this.log.warn(`plantuml-server: unnable to write cache: ${fileName}\n`),
    );
  },

  'page:before': function (this: any, page: { content: string; path: string }) {
    page.content = convertUmlSrcToAbsolute(
      page.content,
      this.resolve('./'),
      page.path,
    );
    page.content = replaceCodeBlock(page.content);
    return page;
  },

  'finish:before': () => {
    assert(plantUMLServer);
    plantUMLServer.writeCache();
  },
};

export const blocks = {
  uml: async function (
    this: any,
    block: { body: string; kwargs: Record<string, string> },
  ) {
    assert(libConfig);
    assert(classConfig);
    assert(plantUMLServer);

    let body: string;
    if (!!block.kwargs['src']) {
      body =
        (await readFile(block.kwargs['src'], 'utf-8').catch((e) => {
          this.log.warn((e?.message ?? e) + '\n');
        })) ?? '';
    } else {
      body = block.body;
    }

    const converted = await plantUMLServer.generate(body);

    let optimized = converted;
    if (libConfig.optimizeImage && converted) {
      optimized = await optimizeImage(converted, classConfig.format);
    }

    const tag = makeHtml(
      optimized ?? new ArrayBuffer(0),
      plantUMLServer.mime(),
      plantUMLServer.cssClass(),
    );
    return tag;
  },
};
