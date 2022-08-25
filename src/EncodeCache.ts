import { createHash } from 'crypto';
import EventEmitter from 'events';
import fs from 'fs';
import mkdirp from 'mkdirp';
import fetch from 'node-fetch';
import { encode } from 'plantuml-encoder';

export const mimes = {
  png: 'image/png',
  svg: 'image/svg+xml',
};

export interface config {
  readonly server: string;
  readonly format: keyof typeof mimes;
  readonly cacheDir: string | null;
}

export interface EncodeCache extends EventEmitter {
  on: ((event: 'process:start', cb: (hash: string) => void) => this) &
    ((event: 'process:memory', cb: (hash: string) => void) => this) &
    ((event: 'process:cache', cb: (hash: string) => void) => this) &
    ((event: 'process:server', cb: (hash: string) => void) => this) &
    ((event: 'cache:write', cb: (fileName: string) => void) => this) &
    ((event: 'cache:error', cb: (fileName: string) => void) => this);
}
export class EncodeCache extends EventEmitter {
  readonly #cache: Map<string, { data: ArrayBuffer; stored: boolean }> =
    new Map();
  readonly #config: config;

  constructor(config: config) {
    super();
    this.#config = {
      server: config.server.replace(/\/$/, ''),
      format: config.format,
      cacheDir: config.cacheDir ? config.cacheDir.replace(/\/$/, '') : null,
    };
  }

  async generate(uml: string): Promise<ArrayBuffer> {
    const encoded = encode(uml);
    const hash = createHash('sha1').update(uml).digest('hex');
    const url = this.#url(encoded);

    this.emit('process:start', hash);

    const cached = this.#cache.get(hash);
    if (cached) {
      this.emit('process:memory', hash);
      return cached.data;
    }

    const stored = await this.readFile(this.#cachePath(hash));
    if (stored) {
      this.#cache.set(hash, { data: stored, stored: true });
      this.emit('process:cache', hash);
      return stored;
    }

    const requested = await this.request(url);
    this.#cache.set(hash, { data: requested, stored: false });
    this.emit('process:server', hash);
    return requested;
  }

  async request(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    const text = await response.buffer();
    return text;
  }

  async writeCache(): Promise<void> {
    if (null == this.#config.cacheDir) {
      return;
    }

    const promises: Promise<unknown>[] = [];
    await this.makeCacheDirectory();

    for (const [hash, cache] of this.#cache) {
      if (cache.stored) {
        continue;
      }
      const fileName = this.#cachePath(hash);
      const promise = this.writeFile(fileName, cache.data);
      promises.push(promise);
    }

    return Promise.all(promises).then();
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
