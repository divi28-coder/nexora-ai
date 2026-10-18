// SAMPLE DATA for demo mode. Fictional; not a real person.
export const sampleJob = `Junior Data Analyst
Required: SQL, Python, Excel, data visualization.
Preferred: Power BI, statistics.
Responsibilities: build reports, clean datasets, present insights.`;

export const sampleRoadmap = [
  { id: 't1', week: 1, title: 'Review your student system architecture', deliverable: 'One-page architecture note' },
  { id: 't2', week: 1, title: 'Explain why you chose Python and MySQL', deliverable: 'Written 150-word explanation' },
  { id: 't3', week: 2, title: 'Practice 3 project interview questions', deliverable: 'Three answers (text is fine)' },
  { id: 't4', week: 3, title: 'Add a true, measurable result to one resume bullet', deliverable: 'Updated resume version' },
  { id: 't5', week: 4, title: 'Build a small SQL dashboard project', deliverable: 'Repo + README' }
];

// Built-in skill lists per role (rule-based, NOT live market data).
export const roleCatalog: Record<string, string[]> = {
  'Data Analyst': ['SQL', 'Python', 'Excel', 'Data Visualization', 'Statistics', 'Power BI'],
  'Backend Developer': ['Python', 'SQL', 'REST APIs', 'Git', 'Testing', 'Docker'],
  'Web Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Git']
};
