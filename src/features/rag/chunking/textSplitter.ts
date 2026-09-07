export interface SplitOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Normalizes markdown text for RAG embedding by stripping container tags
 * like columns while preserving the linear textual content and paragraph flow.
 */
export function normalizeMarkdownForRag(text: string): string {
  if (!text) return '';
  return text
    .replace(/<div\s+class=["']noesis-columns["'][^>]*>/gi, '\n\n')
    .replace(/<div\s+class=["']noesis-column["'][^>]*>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Splits text into overlapping chunks based on character count.
 * Attempts to find logical breakpoints (paragraphs, newlines, sentences) 
 * instead of splitting in the middle of a word.
 */
export function splitTextIntoChunks(text: string, options?: SplitOptions): string[] {
  const cleanText = normalizeMarkdownForRag(text);

  // Standard chunk size: 1000 characters (roughly 150-250 words or ~200 tokens)
  const chunkSize = options?.chunkSize || 1000;
  const chunkOverlap = options?.chunkOverlap || 200;

  if (!cleanText || cleanText.trim() === '') {
    return [];
  }

  if (cleanText.length <= chunkSize) {
    return [cleanText.trim()];
  }

  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < cleanText.length) {
    let endIndex = currentIndex + chunkSize;
    
    // If we're not at the end of the text, try to find a natural break point
    if (endIndex < cleanText.length) {
      // 1. Try to break at a double newline (paragraph)
      let breakPoint = cleanText.lastIndexOf('\n\n', endIndex);
      
      // 2. If no paragraph break in window, try single newline
      if (breakPoint <= currentIndex) {
        breakPoint = cleanText.lastIndexOf('\n', endIndex);
      }
      
      // 3. If no newline, try end of a sentence
      if (breakPoint <= currentIndex) {
        const sentenceBreak = cleanText.lastIndexOf('. ', endIndex);
        if (sentenceBreak > currentIndex) {
          // Include the period in the chunk
          breakPoint = sentenceBreak + 1; 
        }
      }
      
      // 4. If no sentence break, try a space to avoid cutting words
      if (breakPoint <= currentIndex) {
        breakPoint = cleanText.lastIndexOf(' ', endIndex);
      }

      // If we found a valid break point that makes progress
      if (breakPoint > currentIndex) {
        endIndex = breakPoint;
      }
    }

    const chunk = cleanText.slice(currentIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // Move forward, subtracting overlap to ensure context continuity
    currentIndex = endIndex - chunkOverlap;
    
    // Failsafe: prevent infinite loop if overlap is somehow larger than the chunk progression
    if (currentIndex <= chunks.length - 1 ? 0 : currentIndex) {
        // Just move forward minimally if we get stuck
        currentIndex = endIndex;
    }
  }

  return chunks;
}
