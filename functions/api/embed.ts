interface Env {
  AI?: {
    run: (model: string, input: { text: string | string[] }) => Promise<any>;
  };
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  HF_TOKEN?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json().catch(() => ({}));
    
    // Support text (string | string[]) or texts (string[])
    const texts: string[] = Array.isArray(body.texts)
      ? body.texts
      : typeof body.text === 'string'
      ? [body.text]
      : Array.isArray(body.text)
      ? body.text
      : [];

    if (!texts || texts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'text or texts array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Primary: Native Cloudflare Workers AI Binding (env.AI)
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const aiRes: any = await env.AI.run('@cf/baai/bge-m3', { text: texts });
        const rawData = aiRes?.data || aiRes;
        const embeddings: number[][] = Array.isArray(rawData[0]) ? rawData : [rawData];
        
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              embeddings,
              modelUsed: '@cf/baai/bge-m3',
              dimension: embeddings[0]?.length || 1024,
            },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (cfAiErr: any) {
        console.error('[Cloudflare Pages Functions] env.AI.run error:', cfAiErr);
        // Fall through to fallback
      }
    }

    // 2. Fallback: Cloudflare REST API (when env variables set)
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_API_TOKEN;
    if (accountId && apiToken) {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-m3`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: texts }),
        }
      );

      if (cfRes.ok) {
        const cfJson: any = await cfRes.json();
        const rawData = cfJson.result?.data || cfJson.result;
        const embeddings: number[][] = Array.isArray(rawData[0]) ? rawData : [rawData];
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              embeddings,
              modelUsed: '@cf/baai/bge-m3 (Cloudflare REST)',
              dimension: embeddings[0]?.length || 1024,
            },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Fallback: Hugging Face Inference API for BAAI/bge-m3
    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/BAAI/bge-m3',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.HF_TOKEN ? { Authorization: `Bearer ${env.HF_TOKEN}` } : {}),
        },
        body: JSON.stringify({ inputs: texts }),
      }
    );

    if (hfRes.ok) {
      const hfJson: any = await hfRes.json();
      const rawData = Array.isArray(hfJson[0]) ? hfJson : [hfJson];
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            embeddings: rawData,
            modelUsed: 'BAAI/bge-m3 (HuggingFace)',
            dimension: rawData[0]?.length || 1024,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'No active embedding provider configured. Please bind Workers AI (env.AI) in Cloudflare Pages.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
