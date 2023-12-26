import { createHash } from 'crypto';
import EventEmitter from 'events';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import fetch from 'node-fetch';
import { encode } from 'plantuml-encoder';
import promiseRetry from 'promise-retry';

export const mimes = {
  png: 'image/png',
  svg: 'image/svg+xml',
};

export interface config {
  readonly server: string;
  readonly format: keyof typeof mimes;
  readonly cacheDir: string | null;
  readonly cssClass: string | null;
}

export interface PlantUMLServer extends EventEmitter {
  on: ((event: 'process:start', cb: (hash: string) => void) => this) &
    ((event: 'process:memory', cb: (hash: string) => void) => this) &
    ((event: 'process:cache', cb: (hash: string) => void) => this) &
    ((event: 'process:server', cb: (hash: string) => void) => this) &
    ((
      event: 'process:server:error',
      cb: (url: string, e: any) => void,
    ) => this) &
    ((event: 'cache:write', cb: (fileName: string) => void) => this) &
    ((event: 'cache:error', cb: (fileName: string) => void) => this);
}
export class PlantUMLServer extends EventEmitter {
  readonly #cache: Map<string, ArrayBuffer> = new Map();
  readonly #config: config;

  constructor(config: config) {
    super();
    this.#config = {
      server: config.server.replace(/\/$/, ''),
      format: config.format,
      cacheDir: config.cacheDir ? config.cacheDir.replace(/\/$/, '') : null,
      cssClass: config.cssClass,
    };
  }

  async generate(uml: string): Promise<ArrayBuffer | null> {
    const encoded = encode(uml);
    const hash = createHash('sha1').update(uml).digest('hex');
    const url = this.#url(encoded);

    this.emit('process:start', hash);

    const cached = this.#cache.get(hash);
    if (cached) {
      this.emit('process:memory', hash);
      return cached;
    }

    const stored = await this.readFile(this.#cachePath(hash));
    if (stored) {
      this.#cache.set(hash, stored);
      this.emit('process:cache', hash);
      return stored;
    }

    const requested =
      (await this.request(url).catch((e) => {
        this.emit('process:server:error', url, e);
      })) ?? null;
    if (requested) {
      this.#cache.set(hash, requested);
      this.emit('process:server', hash);

      const fileName = this.#cachePath(hash);
      await this.writeFile(fileName, requested);
    }
    return requested;
  }

  async request(url: string): Promise<ArrayBuffer | null> {
    const response = await promiseRetry(
      (retry) => fetch(url, { timeout: 10000 }).catch(retry),
      {
        maxRetryTime: 120000,
        forever: true,
        minTimeout: 1000,
        randomize: true,
      },
    );
    if (!response.ok) {
      this.emit('process:server:error', url, response.statusText);
      return null;
    }
    const text = await response.buffer();
    return text;
  }

  async writeFile(fileName: string | null, data: ArrayBuffer) {
    if (null == fileName) {
      return;
    }
    if (null == this.#config.cacheDir) {
      return;
    }
    return fs.promises
      .writeFile(fileName, Buffer.from(data))
      .then(() => this.emit('cache:write', fileName))
      .catch(() => this.emit('cache:error', fileName));
  }

  async readFile(fileName: string | null) {
    if (null == fileName) {
      return null;
    }
    if (null == this.#config.cacheDir) {
      return null;
    }
    return fs.promises.readFile(fileName).catch(() => null);
  }

  async makeCacheDirectory() {
    if (null == this.#config.cacheDir) {
      return;
    }
    await mkdirp(this.#config.cacheDir);
  }

  mime(): string {
    return mimes[this.#config.format];
  }

  cssClass(): config['cssClass'] {
    return this.#config.cssClass;
  }

  #url(encoded: string): string {
    return [this.#config.server, this.#config.format, encoded].join('/');
  }

  #cachePath(hash: string) {
    if (null == this.#config.cacheDir) {
      return null;
    }
    return (
      this.#config.cacheDir +
      '/honkit-plugin-plantuml-server-' +
      hash +
      '.' +
      this.#config.format
    );
  }
}
