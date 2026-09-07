import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { KeySlotId } from './src/lib/ai/types';
import { handleKeysOverview, handleSingleKeyCheck } from './src/api-core/keysHandler';
import { handleDistil } from './src/api-core/distilHandler';
import { handleAutoDetect, ExistingFolderInfo } from './src/api-core/autoDetectHandler';
import { handleAnalyzeNote } from './src/api-core/analysisHandler';
import { handleGenerateEmbeddings } from './src/api-core/embeddingHandler';
import { handleEditorAction, EditorActionType } from './src/api-core/editorActionHandler';
import { handleChatGenerate, handleChatStream, ChatHistoryMessage } from './src/api-core/chatHandler';
import { handleSummarizeChatMemory } from './src/api-core/chatMemoryHandler';
import { handleVoiceToNote } from './src/api-core/voiceHandler';

// Load environment variables from .env
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));

  // =========================================================================
  // API ROUTES
  // =========================================================================

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // POST /api/keys/status - Check health of all 4 API keys (2 pairs)
  app.post('/api/keys/status', async (req, res) => {
    try {
      const customKeys = (req.body?.customKeys || {}) as Partial<Record<KeySlotId, string>>;
      
      // Menggunakan pola "Adapter" dengan menyerahkan proses ke Core Logic
      const result = await handleKeysOverview(customKeys, process.env);
      
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/keys/status Error]:', error);
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  // POST /api/keys/check-single - Test a single API key slot
  app.post('/api/keys/check-single', async (req, res) => {
    try {
      const { slotId, apiKey } = req.body as { slotId?: KeySlotId; apiKey?: string };

      if (!slotId) {
        return res.status(400).json({ error: 'slotId is required' });
      }

      // Menggunakan pola "Adapter" dengan menyerahkan proses ke Core Logic
      const result = await handleSingleKeyCheck(slotId, apiKey, process.env);
      
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/keys/check-single Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  // POST /api/distil - Distil note content using Pair 2 keys
  app.post('/api/distil', async (req, res) => {
    try {
      const { content, customKeys } = req.body as { content?: string, customKeys?: Partial<Record<KeySlotId, string>> };
      if (!content) {
        return res.status(400).json({ error: 'content is required' });
      }
      
      const result = await handleDistil(content, customKeys, process.env);
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/distil Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  // POST /api/auto-detect - AI Auto-Detect note metadata and folder placement
  app.post('/api/auto-detect', async (req, res) => {
    try {
      const {
        title,
        content,
        currentNoteType,
        existingFolders,
        existingTags,
        existingNoteTypes,
        customKeys,
      } = req.body as {
        title?: string;
        content?: string;
        currentNoteType?: string;
        existingFolders?: ExistingFolderInfo[];
        existingTags?: string[];
        existingNoteTypes?: string[];
        customKeys?: Partial<Record<KeySlotId, string>>;
      };

      if (!content && !title) {
        return res.status(400).json({ error: 'content or title is required' });
      }

      const result = await handleAutoDetect(
        {
          title: title || '',
          content: content || '',
          currentNoteType,
          existingFolders: existingFolders || [],
          existingTags: existingTags || [],
          existingNoteTypes: existingNoteTypes || [],
          customKeys,
        },
        process.env
      );

      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/auto-detect Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  // POST /api/analyze - AI Analysis for RAG
  app.post('/api/analyze', async (req, res) => {
    try {
      const { content, customKeys } = req.body;
      if (!content) return res.status(400).json({ error: 'content is required' });
      const result = await handleAnalyzeNote(content, customKeys, process.env);
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/analyze Error]:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  // POST /api/embeddings & /api/embed - Generate BGE-M3 (1024-dim) Embeddings for RAG
  const embedRouteHandler = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const texts: string[] = Array.isArray(body.texts)
        ? body.texts
        : typeof body.text === 'string'
        ? [body.text]
        : Array.isArray(body.text)
        ? body.text
        : [];

      if (!texts || texts.length === 0) {
        return res.status(400).json({ error: 'text or texts array is required' });
      }

      const result = await handleGenerateEmbeddings(texts, body.customKeys, process.env);
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/embeddings Error]:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  };
  app.post('/api/embeddings', embedRouteHandler);
  app.post('/api/embed', embedRouteHandler);

  // POST /api/editor-action - AI Contextual Actions
  app.post('/api/editor-action', async (req, res) => {
    try {
      const { action, text, extraContext, customKeys } = req.body as {
        action: EditorActionType;
        text: string;
        extraContext?: string;
        customKeys?: Partial<Record<KeySlotId, string>>;
      };

      if (!action || !text) {
        return res.status(400).json({ error: 'action and text are required' });
      }

      const result = await handleEditorAction(action, text, extraContext, customKeys, process.env);
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/editor-action Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  // POST /api/chat/generate & /api/chat - Unified AI Chat with Quality Cascade
  const chatRouteHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { query, contextText, chatHistory, memorySummary, customKeys, temperature } = req.body as {
        query?: string;
        contextText?: string;
        chatHistory?: ChatHistoryMessage[];
        memorySummary?: string;
        customKeys?: Partial<Record<KeySlotId, string>>;
        temperature?: number;
      };

      if (!query) {
        return res.status(400).json({ error: 'query is required' });
      }

      const result = await handleChatGenerate(
        {
          query,
          contextText,
          chatHistory,
          memorySummary,
          customKeys,
          temperature,
        },
        process.env
      );

      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/chat Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  };

  const chatStreamRouteHandler = async (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // NGINX Proxy Padding to force initial buffer flush and disable buffering
    res.write(`: ${' '.repeat(2048)}\n\n`);

    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }
    
    try {
      const { query, contextText, chatHistory, memorySummary, customKeys, temperature } = req.body as any;

      if (!query) {
        res.write(`data: ${JSON.stringify({ error: 'query is required' })}\n\n`);
        return res.end();
      }

      const failoverResult = await handleChatStream(
        {
          query,
          contextText,
          chatHistory,
          memorySummary,
          customKeys,
          temperature,
        },
        (chunkText) => {
          res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        },
        process.env
      );

      if (failoverResult.success) {
        res.write(`data: ${JSON.stringify({ done: true, data: failoverResult.data, cascadeLog: failoverResult.attempts })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ error: 'All providers failed', cascadeLog: failoverResult.attempts })}\n\n`);
      }
      res.end();
    } catch (error: unknown) {
      console.error('[API /api/chat/stream Error]:', error);
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' })}\n\n`);
      res.end();
    }
  };

  // POST /api/chat/summarize-memory - Rolling memory compression for long conversations
  app.post('/api/chat/summarize-memory', async (req, res) => {
    try {
      const { existingSummary, olderMessages, customKeys } = req.body as {
        existingSummary?: string;
        olderMessages: ChatHistoryMessage[];
        customKeys?: Partial<Record<KeySlotId, string>>;
      };

      if (!olderMessages || !Array.isArray(olderMessages) || olderMessages.length === 0) {
        return res.status(400).json({ error: 'olderMessages array is required' });
      }

      const result = await handleSummarizeChatMemory(
        {
          existingSummary,
          olderMessages,
          customKeys,
        },
        process.env
      );

      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/chat/summarize-memory Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  app.post('/api/chat', chatRouteHandler);
  app.post('/api/chat/generate', chatRouteHandler);
  app.post('/api/chat/stream', chatStreamRouteHandler);

  // POST /api/voice-note - Transcribe and structure voice note
  app.post('/api/voice-note', async (req, res) => {
    try {
      const { audioBase64, mimeType, customKeys } = req.body as { audioBase64: string; mimeType: string; customKeys?: Partial<Record<KeySlotId, string>> };
      if (!audioBase64) {
        return res.status(400).json({ error: 'audioBase64 is required' });
      }

      const result = await handleVoiceToNote(audioBase64, mimeType || 'audio/webm', customKeys, process.env);
      res.json(result);
    } catch (error: unknown) {
      console.error('[API /api/voice-note Error]:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

  // =========================================================================
  // VITE / STATIC SERVING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Noesis Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]:', err);
  process.exit(1);
});
