import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PROMPT_SUFFIX = `

Return ONLY a JSON array. Each item must have:
- "question": string
- "options": array of exactly 4 strings
- "correctIndex": number (0-3, which option is correct)
- "explanation": string (brief explanation of why the answer is correct)

No markdown, no extra text. Just the JSON array.`;

function parseQuestions(raw: string): GeneratedQuestion[] {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array from AI.");

  return parsed.filter((item): item is GeneratedQuestion => {
    const q = item as GeneratedQuestion;
    return (
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
    );
  });
}

export async function generateQuestions(
  content: string,
  count: number,
  isTopic = false
): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = isTopic
    ? `Generate ${count} multiple-choice questions on the topic: "${content}".${PROMPT_SUFFIX}`
    : `Generate ${count} multiple-choice questions based on the following content:\n\n${content}${PROMPT_SUFFIX}`;

  const result = await model.generateContent(prompt);
  return parseQuestions(result.response.text());
}

export async function generateQuestionsFromImage(
  base64Data: string,
  mimeType: string,
  count: number
): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    `Generate ${count} multiple-choice questions based on the content in this image.${PROMPT_SUFFIX}`,
  ]);
  return parseQuestions(result.response.text());
}
