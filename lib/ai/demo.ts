// Deterministic demo responses. Used when no AI key is configured.
export function demoQuestions(role: string, category: string, count: number, resumeText = '') {
  const hasPy = /python/i.test(resumeText), hasSql = /sql|mysql/i.test(resumeText);
  const pool: Record<string, string[]> = {
    HR: ['Tell me about yourself.', `Why are you interested in a ${role} role?`, 'What are your strengths and one area you are improving?', 'Where do you see yourself in three years?', 'Why should we consider you for this role?'],
    Behavioral: ['Describe a time you worked in a team to meet a deadline.', 'Tell me about a mistake you made and what you learned.', 'Describe a time you had to learn something quickly.', 'Tell me about a disagreement with a teammate.', 'Describe a goal you achieved through persistence.'],
    Technical: [`What core skills does a ${role} need and which do you have?`, 'Explain the difference between a primary key and a foreign key.', 'How would you find duplicate rows in a table?', 'What is the difference between a list and a tuple in Python?', 'How do you test that your code works?'],
    Project: ['Walk me through the architecture of your main project.', 'Why did you choose those technologies?', 'What was the hardest problem and how did you solve it?', 'How did you test it?', 'How would you scale it to thousands of users?']
  };
  const qs = [...(pool[category] ?? pool.HR)];
  if (category === 'Project' && hasPy && hasSql) qs.unshift('Your resume mentions Python and MySQL. How did you design the database for your project?');
  return qs.slice(0, count).map((q, i) => ({
    id: `q${i + 1}`, question: q,
    followUps: ['Can you give a specific example?', 'What would you do differently now?'],
    basedOnResume: category === 'Project' && i === 0 && hasPy && hasSql
  }));
}

export function demoEvaluate(answer: string) {
  const words = answer.trim().split(/\s+/).length;
  const hasExample = /\b(for example|for instance|i built|i used|i created|we used)\b/i.test(answer);
  const hasResult = /\b(result|improved|reduced|increased|learned|completed)\b/i.test(answer);
  const criteria = [
    { name: 'Specificity', score: hasExample ? 4 : 2, note: hasExample ? 'You gave a concrete example.' : 'Add a concrete example.' },
    { name: 'Completeness', score: hasResult ? 4 : 2, note: hasResult ? 'You described an outcome.' : 'Say what the outcome was.' },
    { name: 'Conciseness', score: words < 20 ? 2 : words > 250 ? 3 : 4, note: words < 20 ? 'Answer is very short.' : 'Length is reasonable.' }
  ];
  return {
    isEstimate: true as const, mode: 'demo' as const, criteria,
    wentWell: criteria.filter(c => c.score >= 4).map(c => c.note),
    missing: criteria.filter(c => c.score < 4).map(c => c.note),
    sampleStructure: 'Situation: set the scene. Task: your responsibility. Action: what you did. Result: what changed.',
    disclaimer: 'Demo-mode feedback uses simple rules. It does not predict hiring outcomes.'
  };
}

export function demoAssistant(message: string, simple: boolean) {
  const m = message.toLowerCase();
  let a = 'In demo mode I can answer a few topics: skills, resume improvement, HR interview prep, or a 30-day plan. Add an API key to get full answers.';
  if (m.includes('skill')) a = 'From the sample resume, your best-supported skills are Python and SQL (both appear in a project). Excel and visualization have no evidence yet.';
  else if (m.includes('resume')) a = 'Your sample resume has a vague bullet ("Worked on the database"). Say what you designed and why. Only add numbers you can verify.';
  else if (m.includes('hr')) a = 'For HR interviews, prepare a 60-second introduction, one strength with an example, and a reason you want this role.';
  else if (m.includes('30')) a = 'Week 1: explain your project architecture. Week 2: practice 3 project questions. Week 3: improve one resume bullet. Week 4: build a small SQL dashboard.';
  if (simple) a += ' (Simple English: pick one small step and do it today.)';
  return a + '\n\n[Demo mode: deterministic sample answer using sample data.]';
}
