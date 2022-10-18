import { dirname } from 'path';
import { strip } from 'png-strip-chunks';
import { optimize, OptimizedSvg } from 'svgo';
import type { config as ClassConfig } from './PlantUMLServer';

export const replaceCodeBlock = (markdown: string): string =>
  markdown.replace(
    /```(?:uml|puml|plantuml)\s+([\s\S]*?)```/gim,
    (_, uml) => '{% uml %}' + '\n' + uml + '{% enduml %}',
  );

export const convertUmlSrcToAbsolute = (
  markdown: string,
  srcBasePath: string,
  srcPath: string,
): string =>
  markdown.replace(
    /(?<={%\s+?uml\s+?)src="(.*?)"(?=\s+?%})/gim,
    (_, src: string) => {
      const pathes = [srcBasePath];
      if (src[0] !== '/') {
        pathes.push(dirname(srcPath));
      } else {
        src = src.slice(1);
      }
      pathes.push(src);

      return `src="${pathes.join('/')}"`;
    },
  );

export const makeHtml = (
  data: ArrayBuffer,
  mime: string,
  cssClass: string | null,
): string => {
  const url =
    'data:' + mime + ';base64,' + Buffer.from(data).toString('base64');
  const tag =
    `<figure class="${cssClass}">` + `<img src="${url}">` + '</figure>';

  return tag;
};

export const optimizeImage = async (
  src: ArrayBuffer,
  format: ClassConfig['format'],
): Promise<Buffer> => {
  const buffer = Buffer.from(src);

  switch (format) {
    case 'png':
      return optimizePng(buffer);
    case 'svg':
      return optimizeSvg(buffer);
  }

  // @ts-expect-error undefined Unreachable code error
  throw new Error(`plantuml-server: invalid format "${format}"`);
};

const isOptimizedSvg = (optimized: any): optimized is OptimizedSvg => {
  return (
    optimized && optimized.error == null && typeof optimized.data === 'string'
  );
};

export const optimizeSvg = async (src: Buffer): Promise<Buffer> => {
  const optimized = optimize(src.toString());
  if (!isOptimizedSvg(optimized)) {
    throw optimized;
  }
  return Buffer.from(optimized.data);
};

export const optimizePng = async (src: Buffer): Promise<Buffer> => {
  return strip(src);
};
