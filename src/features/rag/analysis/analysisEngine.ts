import { KeySlotId } from '../../../lib/ai/types';

export interface AIAnalysisResult {
  summary: string;
  keywords: string[];
  concepts: string[];
  emotion: string;
  modelUsed: string;
  cascadeLog?: any[];
}

export class AnalysisEngine {
  static async analyzeContent(content: string, customKeys?: Partial<Record<KeySlotId, string>>): Promise<AIAnalysisResult> {
    if (!content || content.trim().length === 0) {
      return {
        summary: 'Empty note',
        keywords: [],
        concepts: [],
        emotion: 'Neutral',
        modelUsed: 'none',
        cascadeLog: []
      };
    }

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, customKeys })
    });
    
    if (!res.ok) {
       throw new Error(`Server returned status ${res.status}`);
    }

    const response = await res.json();
    
    if (!response.success || !response.data) {
      throw new Error(`Analysis failed: ${response.attempts?.[response.attempts.length - 1]?.error || 'Unknown error'}`);
    }

    try {
      const parsed = JSON.parse(response.data.text || '{}');
      return {
        summary: parsed.summary || 'No summary generated.',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
        emotion: parsed.emotion || 'Neutral',
        modelUsed: response.data.modelUsed,
        cascadeLog: response.attempts || []
      };
    } catch (e) {
      console.error('Failed to parse AI analysis JSON response:', response.data.text);
      throw new Error('Failed to parse analysis result from AI');
    }
  }
}
