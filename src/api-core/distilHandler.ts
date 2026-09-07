import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getSmartCascade, getHeavyCascade } from '../lib/ai/cascadeProfiles';

export async function handleDistil(
  content: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  // Pre-flight Routing: Bypass Groq for massive documents
  const selectedCascade = content.length > 6000 ? getHeavyCascade() : getSmartCascade();

  return executeWithFailover(
    { cascade: selectedCascade, customKeys, envObj }, 
    async (client, slotId, model) => {
      const prompt = `Please distil the following text into a concise summary and key takeaways:\n\n${content}`;
      
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
      });
      return { text: response.text, modelUsed: model };
    }
  );
}
