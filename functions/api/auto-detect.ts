import { handleAutoDetect } from '../../src/api-core/autoDetectHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    const {
      title,
      content,
      currentNoteType,
      existingFolders,
      existingTags,
      existingNoteTypes,
      customKeys,
    } = body;

    if (!content && !title) {
      return new Response(JSON.stringify({ error: 'content or title is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
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
      context.env
    );

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Auto-detect process failed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
