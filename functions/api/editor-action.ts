import { handleEditorAction } from '../../src/api-core/editorActionHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    
    const { action, text, extraContext, customKeys } = body;
    
    if (!action || !text) {
      return new Response(JSON.stringify({ error: 'action and text are required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleEditorAction(
      action, 
      text, 
      extraContext, 
      customKeys || {}, 
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
