import { tmpdir } from 'os';
import { PlantUMLServer, config, mimes } from './PlantUMLServer';
import { makeHtml, replaceCodeBlock } from './libs';

const defaultConfig: config = {
  server: 'http://www.plantuml.com/plantuml/',
  format: 'svg',
  cacheDir: tmpdir(),
  cssClass: 'plantuml',
};

let plantUMLServer: PlantUMLServer;

export const hooks = {
  init: function (this: any) {
    const config = Object.assign(
      defaultConfig,
      this.config.get('pluginsConfig.plantuml-server'),
    );

    if (true !== Object.keys(mimes).includes(config.format)) {
      throw new Error(`plantuml-server: invalid format "${config.format}"`);
    }

    plantUMLServer = new PlantUMLServer(config);
    plantUMLServer.on('process:start', (hash) =>
      this.log.info(`plantuml-server: converting: ${hash}`),
    );
    plantUMLServer.on('process:memory', (hash) =>
      this.log.info(`plantuml-server: converted from memoty: ${hash}`),
    );
    plantUMLServer.on('process:cache', (hash) =>
      this.log.info(`plantuml-server: converted from cache: ${hash}`),
    );
    plantUMLServer.on('process:server', (hash) =>
      this.log.info(`plantuml-server: converted from server: ${hash}`),
    );
    plantUMLServer.on('cache:write', (fileName) =>
      this.log.info(`plantuml-server: write cache: ${fileName}`),
    );
    plantUMLServer.on('cache:error', (fileName) =>
      this.log.warn(`plantuml-server: unnable to write cache: ${fileName}`),
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
