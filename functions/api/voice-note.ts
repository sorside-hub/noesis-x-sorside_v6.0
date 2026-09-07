import { handleVoiceToNote } from '../../src/api-core/voiceHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    
    const { audioBase64, mimeType, customKeys } = body;
    
    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'audioBase64 is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleVoiceToNote(
      audioBase64, 
      mimeType || 'audio/webm',
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
