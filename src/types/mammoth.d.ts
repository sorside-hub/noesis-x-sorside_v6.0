declare module 'mammoth' {
  export interface ConvertResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export interface ConvertOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
  }

  export function convertToHtml(input: ConvertOptions, options?: any): Promise<ConvertResult>;
  export function extractRawText(input: ConvertOptions): Promise<ConvertResult>;
  export function convertToMarkdown(input: ConvertOptions, options?: any): Promise<ConvertResult>;
}
