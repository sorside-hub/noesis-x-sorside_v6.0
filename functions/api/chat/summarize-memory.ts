import { handleSummarizeChatMemory } from '../../../src/api-core/chatMemoryHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    const { existingSummary, olderMessages, customKeys } = body;

    if (!olderMessages || !Array.isArray(olderMessages) || olderMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'olderMessages array is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleSummarizeChatMemory(
      {
        existingSummary,
        olderMessages,
        customKeys: customKeys || {},
      },
      context.env
    );

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
