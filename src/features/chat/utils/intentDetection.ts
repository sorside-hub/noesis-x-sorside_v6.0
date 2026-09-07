/**
 * Detects whether a user prompt is purely chit-chat, a simple greeting,
 * or polite acknowledgement that should NOT trigger a RAG search.
 */
export function isPureChitChat(query: string): boolean {
  if (!query) return false;

  const clean = query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F]/gi, '') // strip punctuations like ?, !, ., ,
    .replace(/\s+/g, ' ');

  if (!clean) return false;

  // Very short query with non-alphanumeric or single greeting letter like 'p'
  if (clean === 'p' || clean === 'ping') return true;

  // Set of exact match phrases (Indonesian & English greetings, thanks, test, casual phrases)
  const exactChitChatPhrases = new Set([
    // Sapaan / Greetings
    'halo',
    'hallo',
    'hello',
    'hai',
    'hi',
    'hey',
    'hei',
    'helo',
    'holla',
    'pagi',
    'selamat pagi',
    'siang',
    'selamat siang',
    'sore',
    'selamat sore',
    'malam',
    'selamat malam',
    'assalamualaikum',
    'assalamu alaikum',
    'assalamualaikum wr wb',
    'samlekom',
    'good morning',
    'good afternoon',
    'good evening',
    'good night',

    // Casual & Status
    'apa kabar',
    'halo apa kabar',
    'gimana kabarnya',
    'gimana kabar',
    'how are you',
    'hows it going',
    'how is it going',
    'whats up',
    'sup',
    'ada apa',

    // Bot Identity / Casual Test
    'siapa kamu',
    'siapa namamu',
    'kamu siapa',
    'kamu bisa apa',
    'who are you',
    'what are you',
    'tes',
    'test',
    'testing',
    'cek',
    'check',
    '1 2 3',
    'tes 123',
    'test 123',

    // Thanks / Politeness
    'makasih',
    'terima kasih',
    'terimakasih',
    'makasih banyak',
    'terima kasih banyak',
    'thanks',
    'thank you',
    'thx',
    'ty',
    'tq',
    'matur nuwun',
    'nuhun',
    'arigato',
    'sama sama',
    'sama-sama',
    'youre welcome',
    'ur welcome',

    // Acknowledgements
    'ok',
    'oke',
    'okay',
    'okey',
    'siap',
    'sip',
    'mantap',
    'mantul',
    'keren',
    'baik',
    'baiklah',
    'noted',
    'oke makasih',
    'ok makasih',
    'oke terima kasih',
    'ok terima kasih',
    'bye',
    'selamat tinggal',
    'goodbye',
    'dadah'
  ]);

  if (exactChitChatPhrases.has(clean)) {
    return true;
  }

  // Regex pattern for simple variations, e.g. "halo halo", "hai hai", "tes 1 2 3", "halo kak"
  const chitChatRegex = /^(halo|hallo|hai|hi|hey|hei|pagi|siang|sore|malam|makasih|thanks|tes|test|testing)(\s+(halo|hallo|hai|hi|hey|hei|pagi|siang|sore|malam|makasih|thanks|ya|dong|gan|bro|kak|noesis|bot|ai|admin))*$/i;

  if (chitChatRegex.test(clean)) {
    return true;
  }

  return false;
}
