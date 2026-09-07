import { IEmbeddingService } from '../types';
import { KeySlotId } from '../../../lib/ai/types';

export class BgeEmbeddingService implements IEmbeddingService {
  private customKeys?: Partial<Record<KeySlotId, string>>;
  private currentModelName: string = '@cf/baai/bge-m3';
  private currentDimension: number = 1024;

  constructor(customKeys?: Partial<Record<KeySlotId, string>>) {
    this.customKeys = customKeys;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const results = await this.generateEmbeddings([text]);
    return results[0] || [];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    const res = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, customKeys: this.customKeys })
    });

    if (!res.ok) {
       throw new Error(`Server returned status ${res.status}`);
    }

    const result = await res.json();
    
    if (!result.success || !result.data) {
      throw new Error(`Failed to generate embeddings: ${result.error || 'Unknown error'}`);
    }

    this.currentModelName = result.data.modelUsed || '@cf/baai/bge-m3';
    if (result.data.dimension) {
        this.currentDimension = result.data.dimension;
    }

    return result.data.embeddings;
  }

  getModelName(): string {
    return this.currentModelName;
  }

  getDimension(): number {
    return this.currentDimension;
  }
}

// Backward compatibility class & type alias
export class GeminiEmbeddingService extends BgeEmbeddingService {}

