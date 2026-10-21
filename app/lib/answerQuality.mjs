// Spotting an answer that stopped in the middle of a sentence, so the person can be told and offered "Continue".
// High precision on purpose: a notice that cries wolf is worse than none, so only endings no finished sentence has.

const DANGLING_WORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'with', 'by', 'from', 'as', 'at', 'that', 'which', 'is', 'are', 'was', 'were', 'be',
  'this', 'these', 'those', 'its', 'their', 'his', 'her', 'than', 'into', 'about', 'between', 'including', 'such', 'but', 'while', 'where',
]);

/** Paragraphs the app appends after the model's text (a fact-check note, a caveat) say nothing about whether the text itself finished. */
function bodyWithoutNotes(text) {
  const paras = String(text || '').trimEnd().split(/\n{2,}/);
  while (paras.length > 1 && /^\s*[_*]*\s*(note|caveat|disclaimer)\b/i.test(paras[paras.length - 1])) paras.pop();
  return paras.join('\n\n').trimEnd();
}

/** True when the visible answer ends on a word or mark a finished sentence cannot end on. */
export function looksCutOff(text) {
  const body = bodyWithoutNotes(text);
  if (body.length < 160) return false;
  const lastLine = body.split('\n').pop().trim();
  if (!lastLine || /^(\||```|---)/.test(lastLine)) return false; // a table row, a fence or a rule is not a sentence
  const stripped = lastLine.replace(/[*_`~]+$/g, '').trimEnd();
  if (/[,;:(\[—–-]$/.test(stripped)) return true;
  const word = (stripped.match(/([A-Za-z']+)$/) || [])[1];
  return Boolean(word && DANGLING_WORDS.has(word.toLowerCase()));
}

export const CONTINUE_PROMPT = 'Continue from where you stopped and finish the last point.';
