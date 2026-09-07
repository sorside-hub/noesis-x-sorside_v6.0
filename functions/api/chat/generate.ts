import { handleChatGenerate } from '../../../src/api-core/chatHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    
    const { query, contextText, chatHistory, memorySummary, customKeys, temperature } = body;
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleChatGenerate(
      {
        query,
        contextText,
        chatHistory,
        memorySummary,
        customKeys: customKeys || {},
        temperature,
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
