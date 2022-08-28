import { tmpdir } from 'os';
import { PlantUMLServer, config, mimes } from './PlantUMLServer';
import { makeHtml, replaceCodeBlock } from './libs';

const defaultConfig: pluginConfig = {
  server: 'http://www.plantuml.com/plantuml/',
  format: 'svg',
  cacheDir: tmpdir(),
  cssClass: 'plantuml',
  optimizeImage: true,
};

interface pluginConfig extends config {
  optimizeImage: boolean;
}

let plantUMLServer: PlantUMLServer;
const { optimizeImage, ...config } = { ...defaultConfig };

export const hooks = {
  init: function (this: any) {
    Object.assign(
      config,
      this.config.get('pluginsConfig.plantuml-server'),
      // ebook-convert cannot handle svg format data-uri, so it is forced to change to png
      this.output.name === 'ebook' ? { format: 'png' } : {},
    );

    if (true !== Object.keys(mimes).includes(config.format)) {
      throw new Error(`plantuml-server: invalid format "${config.format}"`);
    }

    plantUMLServer = new PlantUMLServer(config);
    plantUMLServer.on('process:start', (hash) =>
      this.log.info(`plantuml-server: converting: ${hash}\n`),
    );
    plantUMLServer.on('process:memory', (hash) =>
      this.log.info(`plantuml-server: converted from memoty: ${hash}\n`),
    );
    plantUMLServer.on('process:cache', (hash) =>
      this.log.info(`plantuml-server: converted from cache: ${hash}\n`),
    );
    plantUMLServer.on('process:server', (hash) =>
      this.log.info(`plantuml-server: converted from server: ${hash}\n`),
    );
    plantUMLServer.on('cache:write', (fileName) =>
      this.log.info(`plantuml-server: write cache: ${fileName}\n`),
    );
    plantUMLServer.on('cache:error', (fileName) =>
      this.log.warn(`plantuml-server: unnable to write cache: ${fileName}\n`),
    );
  },

  'page:before': (page: { content: string }) => {
    page.content = replaceCodeBlock(page.content);
    return page;
  },

  'finish:before': () => plantUMLServer.writeCache(),
};

export const blocks = {
  uml: async (block: { body: string }) => {
    const converted = await plantUMLServer.generate(block.body);
    const tag = makeHtml(
      converted,
      plantUMLServer.mime(),
      plantUMLServer.cssClass(),
    );
    return tag;
  },
};
