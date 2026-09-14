import { handleInboxTriage } from '../../../src/api-core/inboxTriageHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    const { notes, customKeys } = body;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return new Response(JSON.stringify({ error: 'notes array is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleInboxTriage(notes, customKeys, context.env);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Inbox triage process failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}
