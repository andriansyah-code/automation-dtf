declare module "bwip-js" {
  interface ToBufferOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    textyalign?: string;
  }
  function toBuffer(opts: ToBufferOptions): Buffer;
  export = { toBuffer };
}
