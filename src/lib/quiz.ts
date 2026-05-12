export interface StoredQuestion {
  id: string;
  questionText: string;
  options: string;
  correctAnswerIndex: number;
  explanation?: string | null;
}

export interface ShuffledQuestion {
  questionId: string;
  questionText: string;
  shuffledOptions: string[];
  shuffledCorrectIndex: number;
  explanation?: string | null;
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function selectAndShuffleQuestions(
  questions: StoredQuestion[],
  count: number
): ShuffledQuestion[] {
  const selected = fisherYates(questions).slice(0, count);
  return selected.map((q) => {
    const options: string[] = JSON.parse(q.options);
    const indexed = options.map((text, idx) => ({ text, idx }));
    const shuffled = fisherYates(indexed);
    const shuffledCorrectIndex = shuffled.findIndex(
      (o) => o.idx === q.correctAnswerIndex
    );
    return {
      questionId: q.id,
      questionText: q.questionText,
      shuffledOptions: shuffled.map((o) => o.text),
      shuffledCorrectIndex,
      explanation: q.explanation,
    };
  });
}
