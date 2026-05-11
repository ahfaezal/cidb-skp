import { NextResponse } from "next/server";

type QuestionBuilderPayload = {
  files: Array<{ name: string; size: number; type: string }>;
  questionTypes: Array<"Objektif" | "Subjektif">;
  objectiveCount: number;
  subjectiveCount: number;
  skillCategories: string[];
  difficultyDistribution: Record<string, number>;
  generateAnswerScheme: boolean;
  generateRubric: boolean;
};

type GeneratedQuestion = {
  id: string;
  type: "Objektif" | "Subjektif";
  difficulty: string;
  skillCategory: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  answerScheme?: string[] | string;
  rubric?: Array<{
    criteria: string;
    marks: number;
    description: string;
  }>;
  rationale?: string;
};

function buildPrompt(payload: QuestionBuilderPayload) {
  return `
You are an AI question builder for SKP-CIDB competency-based training in Malaysia.
Write in Malay. Generate assessment questions from uploaded note metadata and settings.

Return valid JSON only with this shape:
{
  "questions": [
    {
      "id": "string",
      "type": "Objektif or Subjektif",
      "difficulty": "Rendah or Sederhana or Tinggi",
      "skillCategory": "Prosedur or Fakta / Teori or Sikap or Keselamatan or Persekitaran",
      "question": "string",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "answerScheme": ["string"],
      "rubric": [{"criteria":"string","marks":5,"description":"string"}],
      "rationale": "string"
    }
  ],
  "analysis": {
    "detectedTopics": ["string"],
    "skillDistribution": {"Prosedur": 40},
    "difficultyDistribution": {"Rendah": 30, "Sederhana": 50, "Tinggi": 20}
  }
}

Rules:
- Objective questions must include four options, correctAnswer and short rationale.
- Subjective questions must include main answerScheme points.
- Subjective questions must include rubric when generateRubric is true.
- Use the requested question type counts.
- Use the requested skill categories and difficulty distribution.
- Keep questions practical for construction or rail training if the topic is unclear.

Settings:
${JSON.stringify(payload, null, 2)}
`;
}

function extractResponseText(payload: unknown) {
  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
        type?: string;
      }>;
    }>;
  };

  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response was not valid JSON.");
    }

    return JSON.parse(match[0]);
  }
}

function pickByDistribution(distribution: Record<string, number>, index: number) {
  const entries = Object.entries(distribution).filter(([, value]) => value > 0);

  if (entries.length === 0) {
    return "Sederhana";
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const cursor = ((index * 37) % total) + 1;
  let running = 0;

  for (const [label, value] of entries) {
    running += value;
    if (cursor <= running) {
      return label;
    }
  }

  return entries[0][0];
}

function buildFallbackResponse(payload: QuestionBuilderPayload) {
  const detectedTopic =
    payload.files[0]?.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ||
    "Keselamatan dan Prosedur Kerja";
  const questions: GeneratedQuestion[] = [];

  if (payload.questionTypes.includes("Objektif")) {
    for (let index = 0; index < payload.objectiveCount; index += 1) {
      const skill =
        payload.skillCategories[index % payload.skillCategories.length] || "Keselamatan";
      questions.push({
        id: `obj-${index + 1}`,
        type: "Objektif",
        difficulty: pickByDistribution(payload.difficultyDistribution, index),
        skillCategory: skill,
        question: `Apakah tindakan paling sesuai berkaitan ${detectedTopic} bagi kategori ${skill.toLowerCase()}?`,
        options: [
          "A. Mengabaikan pemeriksaan awal",
          "B. Mematuhi prosedur kerja dan arahan keselamatan",
          "C. Memulakan kerja tanpa peralatan lengkap",
          "D. Menyerahkan semua keputusan kepada pembantu",
        ],
        correctAnswer: "B",
        answerScheme: payload.generateAnswerScheme
          ? ["Jawapan betul ialah B.", "Calon mengenal pasti amalan kerja selamat."]
          : [],
        rationale:
          "Pilihan B menekankan pematuhan prosedur dan keselamatan sebagai asas kerja kompeten.",
      });
    }
  }

  if (payload.questionTypes.includes("Subjektif")) {
    for (let index = 0; index < payload.subjectiveCount; index += 1) {
      const skill =
        payload.skillCategories[(index + 2) % payload.skillCategories.length] ||
        "Prosedur";
      questions.push({
        id: `sub-${index + 1}`,
        type: "Subjektif",
        difficulty: pickByDistribution(payload.difficultyDistribution, index + 11),
        skillCategory: skill,
        question: `Terangkan langkah utama yang perlu diambil untuk memastikan ${detectedTopic} dilaksanakan mengikut keperluan ${skill.toLowerCase()}.`,
        answerScheme: payload.generateAnswerScheme
          ? [
              "Kenal pasti skop kerja dan risiko utama.",
              "Sediakan peralatan, bahan dan dokumen rujukan.",
              "Laksanakan kerja mengikut prosedur dan rekodkan pemeriksaan.",
            ]
          : [],
        rubric: payload.generateRubric
          ? [
              {
                criteria: "Ketepatan isi",
                marks: 4,
                description: "Isi selari dengan prosedur dan konteks kerja.",
              },
              {
                criteria: "Urutan langkah",
                marks: 3,
                description: "Jawapan menunjukkan turutan kerja yang logik.",
              },
              {
                criteria: "Keselamatan",
                marks: 3,
                description: "Risiko dan kawalan keselamatan dinyatakan dengan jelas.",
              },
            ]
          : [],
        rationale:
          "Soalan subjektif ini menguji kefahaman proses, justifikasi tindakan dan aplikasi amali.",
      });
    }
  }

  const skillShare = Math.round(100 / Math.max(1, payload.skillCategories.length));
  const skillDistribution = payload.skillCategories.reduce<Record<string, number>>(
    (current, category, index) => ({
      ...current,
      [category]:
        index === payload.skillCategories.length - 1
          ? 100 - skillShare * (payload.skillCategories.length - 1)
          : skillShare,
    }),
    {}
  );

  return {
    questions,
    analysis: {
      detectedTopics: [
        detectedTopic,
        "Prosedur Kerja",
        "Keselamatan Kerja",
        "Pemeriksaan dan Kawalan Kualiti",
      ],
      skillDistribution,
      difficultyDistribution: payload.difficultyDistribution,
    },
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as QuestionBuilderPayload;

  if (!payload.questionTypes?.length) {
    return NextResponse.json(
      { error: "questionTypes is required." },
      { status: 400 }
    );
  }

  const difficultyTotal = Object.values(payload.difficultyDistribution ?? {}).reduce(
    (sum, value) => sum + Number(value),
    0
  );

  if (difficultyTotal !== 100) {
    return NextResponse.json(
      { error: "difficultyDistribution total must be 100." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(buildFallbackResponse(payload));
  }

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.2",
      input: buildPrompt(payload),
    }),
  });

  if (!aiResponse.ok) {
    return NextResponse.json(
      { error: "AI generation request failed." },
      { status: 502 }
    );
  }

  const text = extractResponseText(await aiResponse.json());
  const result = safeParseJson(text);

  return NextResponse.json(result);
}
