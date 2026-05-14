export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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

async function groqChat(messages: unknown[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function generateQuestions(
  content: string,
  count: number,
  isTopic = false
): Promise<GeneratedQuestion[]> {
  const prompt = isTopic
    ? `Generate ${count} multiple-choice questions on the topic: "${content}".${PROMPT_SUFFIX}`
    : `Generate ${count} multiple-choice questions based on the following content:\n\n${content}${PROMPT_SUFFIX}`;

  const raw = await groqChat([{ role: "user", content: prompt }]);
  return parseQuestions(raw);
}

export async function generateQuestionsFromImage(
  base64Data: string,
  mimeType: string,
  count: number
): Promise<GeneratedQuestion[]> {
  const raw = await groqChat([
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
        { type: "text", text: `Generate ${count} multiple-choice questions based on the content in this image.${PROMPT_SUFFIX}` },
      ],
    },
  ]);
  return parseQuestions(raw);
}
