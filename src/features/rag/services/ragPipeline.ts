import { db } from '../../../lib/db';
import { generateContentHash } from '../utils/hash';
import { ChunkerService } from '../chunking/chunkerService';
import { GeminiEmbeddingService } from '../embedding/geminiEmbedding';
import { SupabaseVectorStore } from '../vector/supabaseStore';
import { SupabaseMetadataStore } from '../analysis/supabaseMetadataStore';
import { AnalysisEngine } from '../analysis/analysisEngine';
import { EmbeddingRecord, AIAnalysisRecord } from '../types/models';
import { KeySlotId } from '../../../lib/ai/types';

export interface SearchResultChunk {
  noteId: string;
  noteTitle: string;
  snippet: string;
  score: number;
}

export type RagSyncStatus = 'unprocessed' | 'synced' | 'out_of_sync' | 'error';

export class RAGPipeline {
  private embeddingService: GeminiEmbeddingService;
  private vectorStore: SupabaseVectorStore;
  private metadataStore: SupabaseMetadataStore;

  constructor(customKeys?: Partial<Record<KeySlotId, string>>) {
    this.embeddingService = new GeminiEmbeddingService(customKeys);
    this.vectorStore = new SupabaseVectorStore();
    this.metadataStore = new SupabaseMetadataStore();
  }

  /**
   * Two-Stage Hybrid Search & Reranking (Pillar 2 & 4 of Smart Brainstorming RAG)
   */
  async searchSimilarChunks(query: string, topK: number = 5, minScore: number = 0.55): Promise<SearchResultChunk[]> {
    if (!query || query.trim() === '') return [];

    // Stage 1: Coarse Search via Vector Similarity (fetch 3x the requested topK)
    const queryVector = await this.embeddingService.generateEmbedding(query);
    const coarseLimit = topK * 3;
    const rawCandidates = await this.vectorStore.search(queryVector, coarseLimit);

    if (rawCandidates.length === 0) return [];

    // Prepare query words for Concept Overlap checking
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const results: SearchResultChunk[] = [];

    // Stage 2: Fine Rerank & Noise Filter (Concept Overlap + Document Grouping)
    for (const record of rawCandidates) {
      // In Supabase, the structure might be different (e.g. record.similarity)
      let finalScore = record.similarityScore || record.similarity || 0;
      
      // record from supabase RPC will have note_id, content
      const actualNoteId = record.noteId || record.note_id;
      
      const note = await db.nodes.get(actualNoteId);
      const title = note?.name || 'Catatan Tanpa Judul';
      
      // Concept Overlap Boost
      const analysis = await this.metadataStore.get(actualNoteId);
      if (analysis) {
        let matchCount = 0;
        const allTags = [...analysis.keywords, ...analysis.concepts].map(t => t.toLowerCase());
        
        for (const tag of allTags) {
          for (const word of queryWords) {
            if (tag.includes(word) || word.includes(tag)) {
              matchCount++;
            }
          }
        }
        
        // Boost score slightly based on concept/keyword overlap (Max +0.15 boost)
        const boost = Math.min(matchCount * 0.03, 0.15);
        finalScore += boost;
      }
      
      results.push({
        noteId: actualNoteId,
        noteTitle: title,
        snippet: record.content,
        score: finalScore
      });
    }

    // Sort descending by final hybrid score
    results.sort((a, b) => b.score - a.score);

    // Filter noise using the configured minScore threshold
    const filteredResults = results.filter(r => r.score >= minScore);

    // Return final Top-K
    return filteredResults.slice(0, topK);
  }

  /**
   * The core ingestion flow. Call this in the background when a note is saved.
   * It handles hashing, smart skipping, chunking, embedding, and storage.
   */
  async processNote(noteId: string, content: string): Promise<boolean> {
    try {
      if (!content || content.trim() === '') {
        // Clean up if note is emptied
        await this.vectorStore.deleteByNoteId(noteId);
        await this.metadataStore.delete(noteId);
        return true;
      }

      // 1. Calculate Content Hash
      const currentHash = await generateContentHash(content);

      // 2. Check if re-indexing is needed
      const existingAnalysis = await this.metadataStore.get(noteId);
      if (existingAnalysis && existingAnalysis.contentHash === currentHash) {
        // Content hasn't changed, skip entire pipeline to save API calls and CPU
        console.log(`[RAG] Skipping note ${noteId}, content hash matches.`);
        return true;
      }

      console.log(`[RAG] Processing note ${noteId}...`);

      // 3. Clean up old chunks & vectors
      await this.vectorStore.deleteByNoteId(noteId);

      // 4. AI Analysis Layer (Distillation)
      const analysisData = await AnalysisEngine.analyzeContent(content, (this.embeddingService as any).customKeys);
      
      const analysisRecord: AIAnalysisRecord = {
        noteId,
        contentHash: currentHash,
        summary: analysisData.summary,
        keywords: analysisData.keywords,
        concepts: analysisData.concepts,
        emotion: analysisData.emotion,
        modelUsed: analysisData.modelUsed,
        cascadeLog: analysisData.cascadeLog,
        createdAt: existingAnalysis ? existingAnalysis.createdAt : Date.now(),
        updatedAt: Date.now()
      };
      
      // Save analysis to DB
      await this.metadataStore.put(analysisRecord);

      // 5. Chunking Layer
      const originalChunks = ChunkerService.chunkOriginalContent(content);
      
      // Construct a dense "distil content" string from the analysis
      const distilText = [
        `Summary: ${analysisData.summary}`,
        `Keywords: ${analysisData.keywords.join(', ')}`,
        `Core Concepts: ${analysisData.concepts.join(', ')}`
      ].join('\n\n');
      const distilChunks = ChunkerService.chunkDistilContent(distilText);
      
      const allChunks = [...originalChunks, ...distilChunks];

      if (allChunks.length === 0) return true;

      // 6. Embedding Layer (Batch API call)
      const textsToEmbed = allChunks.map(c => c.text);
      const embeddings = await this.embeddingService.generateEmbeddings(textsToEmbed);
      const modelName = this.embeddingService.getModelName();
      const dimension = this.embeddingService.getDimension();

      // 7. Storage Layer
      const embeddingRecords: EmbeddingRecord[] = allChunks.map((chunk, idx) => ({
        id: crypto.randomUUID(),
        noteId,
        chunkIndex: chunk.chunkIndex,
        sourceType: chunk.sourceType,
        content: chunk.text,
        embedding: embeddings[idx],
        embeddingModel: modelName,
        dimension: dimension,
        createdAt: Date.now()
      }));

      await this.vectorStore.add(embeddingRecords);
      
      console.log(`[RAG] Note ${noteId} successfully indexed. Generated ${embeddingRecords.length} vectors.`);
      return true;

    } catch (error) {
      console.error(`[RAG] Failed to process note ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Helper to delete a note from the RAG pipeline entirely.
   */
  async deleteNote(noteId: string): Promise<void> {
    await this.vectorStore.deleteByNoteId(noteId);
    await this.metadataStore.delete(noteId);
  }

  /**
   * Checks if a note's current content matches the indexed content hash.
   */
  async getSyncStatus(noteId: string, content: string): Promise<RagSyncStatus> {
    if (!content || content.trim() === '') return 'unprocessed';
    
    const currentHash = await generateContentHash(content);
    const existingAnalysis = await this.metadataStore.get(noteId);
    
    if (!existingAnalysis) {
      return 'unprocessed';
    }
    
    if (existingAnalysis.contentHash === currentHash) {
      return 'synced';
    } else {
      return 'out_of_sync';
    }
  }

  /**
   * Retrieves the current AI analysis metadata for a note.
   */
  async getMetadata(noteId: string): Promise<AIAnalysisRecord | null> {
    return await this.metadataStore.get(noteId);
  }
}
