// Auto-extracted from syntaxia.html
import { KB } from '../data/kb.js';

export const SYS_GEN=`You are Syntaxia AI — a friendly coding tutor inside a gamified learning app. Help learners with Python, JavaScript, HTML, CSS, Java, SQL, TypeScript, Go, Rust, C++, and more. Keep replies short (3-5 sentences). Use emoji. Never give full solutions — guide with hints. Format code with backticks.`;
export const SYS_LES=`You are Syntaxia AI — a coding tutor inside a gamified learning app. The student is working on a specific lesson. Give hints, not full answers. Keep it short and encouraging. Format code with backticks.`;

export function offlineAI(question, lessonCtx){
  const q=question.toLowerCase();
  // Check for lesson context match first
  let best=null, bestScore=0;
  for(const entry of KB){
    // Boost score if language matches lesson context
    const langBonus=(lessonCtx&&entry.lang!=='any'&&entry.lang===lessonCtx?.id)?2:0;
    const matches=entry.k.filter(kw=>q.includes(kw)).length;
    const score=matches+langBonus;
    if(score>bestScore){bestScore=score;best=entry;}
  }
  if(best&&bestScore>0)return best.a;
  // Fallback contextual response
  if(lessonCtx){
    return 'Great question about **'+lessonCtx.t+'**! 💡\n\nHere is a hint: re-read the lesson explanation carefully and look at the **expected output** — work backwards from what the output should be.\n\nIf you are stuck, try the "Show Solution" button to study the answer, then write it yourself from memory. That is how real learning happens! 🧠';
  }
  return 'Good question! 🤔\n\nCould you be a bit more specific? For example:\n- Which language or lesson are you working on?\n- What have you tried so far?\n- What is the expected vs actual output?\n\nI am here to help you learn! 🚀';
}
