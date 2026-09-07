import { MediaAttachment } from '../../../lib/db';

export const handleCopyMediaLink = (
  item: MediaAttachment, 
  type: 'markdown' | 'url' = 'markdown'
): string => {
  const text = type === 'markdown'
    ? (item.type === 'image' ? `![${item.title}](${item.url})` : `[${item.title}](${item.url})`)
    : item.url;

  navigator.clipboard.writeText(text);
  return text;
};

export const convertAudioUrlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
  const res = await fetch(url);
  const blob = await res.blob();
  const reader = new FileReader();

  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    base64,
    mimeType: blob.type || 'audio/webm'
  };
};
