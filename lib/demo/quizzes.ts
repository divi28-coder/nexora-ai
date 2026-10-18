export const quizzes: Record<string, { q: string; options: string[]; answer: number; why: string }[]> = {
  SQL: [
    { q: 'Which clause filters rows before grouping?', options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'], answer: 1, why: 'WHERE filters rows before GROUP BY; HAVING filters groups.' },
    { q: 'Which join keeps all rows from the left table?', options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'SELF JOIN'], answer: 1, why: 'LEFT JOIN keeps every left-table row, with NULLs for missing matches.' },
    { q: 'What does a PRIMARY KEY guarantee?', options: ['Sorted rows', 'Unique, non-null identifier', 'Faster writes', 'Encrypted data'], answer: 1, why: 'A primary key uniquely identifies each row and cannot be NULL.' },
    { q: 'Which finds duplicate emails?', options: ['GROUP BY email HAVING COUNT(*)>1', 'ORDER BY email', 'WHERE email=1', 'DISTINCT email'], answer: 0, why: 'Group by email and keep groups with more than one row.' }],
  Python: [
    { q: 'Which type is immutable?', options: ['list', 'dict', 'tuple', 'set'], answer: 2, why: 'Tuples cannot be changed after creation.' },
    { q: 'What does len("abc") return?', options: ['2', '3', '4', 'Error'], answer: 1, why: 'The string has 3 characters.' },
    { q: 'Which keyword defines a function?', options: ['func', 'define', 'def', 'lambda only'], answer: 2, why: '`def` defines a named function.' },
    { q: 'What is the output of [1,2,3][-1]?', options: ['1', '3', 'Error', '-1'], answer: 1, why: 'Index -1 is the last element.' }],
  Communication: [
    { q: 'In the STAR method, what does R stand for?', options: ['Reason', 'Result', 'Role', 'Review'], answer: 1, why: 'Situation, Task, Action, Result.' },
    { q: 'Best way to answer "Tell me about yourself"?', options: ['Full life story', 'Short, role-relevant summary', 'Read your resume aloud', 'Skip it'], answer: 1, why: 'Keep it brief and relevant to the role.' },
    { q: 'You do not know an answer. Best response?', options: ['Guess confidently', 'Say what you know and how you would find out', 'Stay silent', 'Change topic'], answer: 1, why: 'Honesty plus a clear approach is stronger than bluffing.' }]
};
