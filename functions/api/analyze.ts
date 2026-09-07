import { handleAnalyzeNote } from '../../src/api-core/analysisHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    const { content, customKeys } = body;

    if (!content) {
      return new Response(JSON.stringify({ error: 'content is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleAnalyzeNote(content, customKeys, context.env);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Analysis process failed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
