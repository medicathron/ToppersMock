import Anthropic from "@anthropic-ai/sdk";

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateQuestions(
  content: string,
  count: number,
  isTopic = false
): Promise<GeneratedQuestion[]> {
  const context = isTopic
    ? `Generate ${count} multiple-choice questions on the topic: "${content}".`
    : `Generate ${count} multiple-choice questions based on the following content:\n\n${content}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${context}

Return ONLY a JSON array. Each item must have:
- "question": string
- "options": array of exactly 4 strings
- "correctIndex": number (0-3, which option is correct)
- "explanation": string (brief explanation of why the answer is correct, optional but preferred)

No markdown, no extra text. Just the JSON array.`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Claude returned invalid JSON. Please try again.");
  }

  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array from Claude.");

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

export async function generateQuestionsFromImage(
  base64Data: string,
  mimeType: string,
  count: number
): Promise<GeneratedQuestion[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Data,
            },
          },
          {
            type: "text",
            text: `Generate ${count} multiple-choice questions based on the content in this image.

Return ONLY a JSON array. Each item must have:
- "question": string
- "options": array of exactly 4 strings
- "correctIndex": number (0-3)
- "explanation": string (brief explanation)

No markdown, no extra text. Just the JSON array.`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Claude returned invalid JSON for image.");
  }

  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array from Claude.");

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
