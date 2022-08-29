declare module 'png-strip-chunks' {
  export async function strip(
    png: Buffer,
    keep?: string[] | string[][],
  ): Promise<Buffer>;
}
