import { handleChatStream } from '../../../src/api-core/chatHandler';

export async function onRequestPost(context: any) {
  const request = context.request;
  const body = await request.json().catch(() => ({}));
  const { query, contextText, chatHistory, memorySummary, customKeys, temperature } = body;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Run async stream in background
  context.waitUntil((async () => {
    try {
      if (!query) {
         await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'query is required' })}\n\n`));
         return;
      }
      
      // Flush immediate comment to prevent Edge buffering on Cloudflare
      await writer.write(encoder.encode(`: ${' '.repeat(2048)}\n\n`));

      const failoverResult = await handleChatStream(
        { query, contextText, chatHistory, memorySummary, customKeys: customKeys || {}, temperature },
        async (chunkText) => {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`));
        },
        context.env
      );
      
      if (failoverResult.success) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, data: failoverResult.data, cascadeLog: failoverResult.attempts })}\n\n`));
      } else {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'All providers failed', cascadeLog: failoverResult.attempts })}\n\n`));
      }
    } catch (error: any) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
    } finally {
      await writer.close();
    }
  })());

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
