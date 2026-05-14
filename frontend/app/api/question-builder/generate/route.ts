import { NextResponse } from "next/server";

type QuestionBuilderPayload = {
  files: Array<{ name: string; size: number; type: string }>;
  questionTypes: Array<"Objektif" | "Subjektif">;
  objectiveCount: number;
  subjectiveCount: number;
  skillCategories: string[];
  difficultyLevels: string[];
  language?: "Bahasa Melayu" | "English";
  generateAnswerScheme: boolean;
  generateRubric: boolean;
};

type OpenAIContent =
  | {
      type: "input_text";
      text: string;
    }
  | {
      type: "input_file";
      filename: string;
      file_data: string;
    };

const requiredSkillCategories = [
  "Prosedur",
  "Fakta / Teori",
  "Sikap / Keselamatan / Alam Sekitar",
];

const requiredDifficultyLevels = [
  "Aras Rendah",
  "Aras Sederhana",
  "Aras Tinggi",
];

function buildPrompt(payload: QuestionBuilderPayload, uploadedFileNames: string[]) {
  const language = payload.language || "Bahasa Melayu";
  const languageInstruction =
    language === "English"
      ? "Write all generated question content in professional English."
      : "Write all generated question content in professional Malay.";

  return `
You are an AI question builder for SKP-CIDB competency-based training in Malaysia.
${languageInstruction} Generate assessment questions by reading and using the uploaded note files attached in this request.
Do not generate generic template questions. Every question must be grounded in the uploaded notes.
If the uploaded notes do not contain enough information, return a clear error JSON instead of inventing content.

Return valid JSON only with this shape:
{
  "questions": [
    {
      "id": "string",
      "type": "Objektif or Subjektif",
      "difficulty": "Aras Rendah or Aras Sederhana or Aras Tinggi",
      "skillCategory": "Prosedur or Fakta / Teori or Sikap / Keselamatan / Alam Sekitar",
      "question": "string",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "answerScheme": ["string"],
      "rubric": [{"criteria":"string","marks":5,"description":"string"}],
      "rationale": "string",
      "sourceReference": "string",
      "skillRationale": "string",
      "difficultyRationale": "string"
    }
  ],
  "analysis": {
    "detectedTopics": ["string"],
    "skillDistribution": {"Prosedur": 40},
    "difficultyDistribution": {"Aras Rendah": 34, "Aras Sederhana": 33, "Aras Tinggi": 33}
  }
}

Rules:
- Objective questions must include four options, correctAnswer and short rationale.
- Subjective questions must include main answerScheme points.
- Subjective questions must include rubric when generateRubric is true.
- Use the requested question type counts.
- REQUIRED: Every question must use exactly one skillCategory from the selected skillCategories.
- REQUIRED: Every question must use exactly one difficulty from the selected difficultyLevels.
- REQUIRED: The generated set must use only the selected skillCategories and selected difficultyLevels.
- REQUIRED: Treat the user's 8 input groups as mandatory generation parameters:
  1. uploaded files metadata,
  2. questionTypes,
  3. question counts for objectiveCount and subjectiveCount,
  4. skillCategories,
  5. difficultyLevels,
  6. language,
  7. generateAnswerScheme,
  8. generateRubric.
- REQUIRED: Use the selected language for question, options, answerScheme, rubric.description, rationale, sourceReference, skillRationale, difficultyRationale and analysis.detectedTopics: ${language}.
- REQUIRED: Every question must include sourceReference explaining where the question content comes from in the uploaded notes. Use this format only: "Rujukan: Seksyen [section number] - [section title/content]". Do not use page numbers or "m/s" because page numbers may change. If no clear section number exists, use "Rujukan: Bahagian [relevant section title]".
- Keep system metadata values such as type, difficulty and skillCategory in the allowed labels so app validation does not fail.
- REQUIRED: CIDB Kata Kerja / Verb format applies only to objective questions with skillCategory "Prosedur".
- For "Prosedur" questions, answer options must begin with a clear active Kata Kerja / Verb because procedure questions assess steps, actions, work methods or process compliance. For English, use verbs such as Identify, Select, Use, Check, Apply, Maintain, Inspect, Position, Label, Plan, Increase, Minimize or Verify. For Bahasa Melayu, use kata kerja such as Kenal pasti, Pilih, Gunakan, Semak, Laksanakan, Kekalkan, Periksa, Letakkan, Labelkan, Rancang, Tingkatkan, Kurangkan or Sahkan.
- For "Fakta / Teori" and "Sikap / Keselamatan / Alam Sekitar", do not force options or combinationItems to begin with a Kata Kerja / Verb. Generate natural options based on the question context, such as terms, standards, principles, concepts, facts, safety practices, environmental impacts, work attitudes or appropriate responses.
- For "Soalan Satu (1) Pilihan", sort A-D options from shortest to longest. If skillCategory is "Prosedur", every A-D option must begin with a Kata Kerja / Verb. If skillCategory is not "Prosedur", do not add verbs artificially.
- For "Soalan Aneka Gabungan", sort combinationItems I-IV from shortest to longest. If skillCategory is "Prosedur", every combinationItems statement I-IV must begin with a Kata Kerja / Verb because A-D are fixed combination labels. If skillCategory is not "Prosedur", combinationItems may use natural terms, concepts, facts, principles or statements.
- REQUIRED: Interpret the selected skillCategories using these definitions:
  - Prosedur merujuk kepada tatacara, proses atau kaedah kerja yang perlu diikuti untuk menyelesaikan sesuatu tugasan berdasarkan peraturan, langkah dan standard yang telah ditetapkan.
  - Fakta / Teori merujuk kepada pengetahuan, maklumat, prinsip atau konsep yang mempunyai kesahan berdasarkan bukti yang jelas serta digunakan untuk memahami, menerangkan dan merumus sesuatu perkara dengan tepat.
  - Sikap / Keselamatan / Alam Sekitar merujuk kepada tingkah laku, respons dan amalan kerja seseorang semasa melaksanakan tugasan dengan mengambil kira disiplin kerja, pematuhan langkah keselamatan serta kesan terhadap diri, tempat kerja dan alam sekitar.
- REQUIRED: Every question must include skillRationale explaining why the selected skillCategory fits the question.
- REQUIRED: Every question must include difficultyRationale explaining why the selected difficulty fits the Bloom level and cognitive demand.
- Do not invent other skill categories such as separate Sikap, Keselamatan or Alam Sekitar. Use the combined category exactly as "Sikap / Keselamatan / Alam Sekitar".
- Keep questions practical for construction or rail training if the topic is unclear.

Allowed skill categories:
${requiredSkillCategories.join(", ")}

Allowed difficulty levels:
${requiredDifficultyLevels.join(", ")}

Settings:
${JSON.stringify(payload, null, 2)}

Uploaded files to use as source material:
${uploadedFileNames.length ? uploadedFileNames.map((name) => `- ${name}`).join("\n") : "- None"}
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

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return {
      payload: (await request.json()) as QuestionBuilderPayload,
      uploadedFiles: [] as File[],
    };
  }

  const formData = await request.formData();
  const settings = formData.get("settings");

  if (typeof settings !== "string") {
    throw new Error("Missing question builder settings.");
  }

  return {
    payload: JSON.parse(settings) as QuestionBuilderPayload,
    uploadedFiles: formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0),
  };
}

async function buildFileContent(files: File[]) {
  const content: OpenAIContent[] = [];

  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "txt") {
      content.push({
        type: "input_text",
        text: `Uploaded note file: ${file.name}\n\n${await file.text()}`,
      });
      continue;
    }

    content.push({
      type: "input_file",
      filename: file.name,
      file_data: Buffer.from(await file.arrayBuffer()).toString("base64"),
    });
  }

  return content;
}

export async function POST(request: Request) {
  let payload: QuestionBuilderPayload;
  let uploadedFiles: File[];

  try {
    const parsed = await parseRequest(request);
    payload = parsed.payload;
    uploadedFiles = parsed.uploadedFiles;
  } catch {
    return NextResponse.json(
      { error: "Invalid question builder request." },
      { status: 400 }
    );
  }

  if (!payload.questionTypes?.length) {
    return NextResponse.json(
      { error: "questionTypes is required." },
      { status: 400 }
    );
  }

  const invalidSkills = (payload.skillCategories ?? []).filter(
    (category) => !requiredSkillCategories.includes(category)
  );

  if (invalidSkills.length > 0 || !payload.skillCategories?.length) {
    return NextResponse.json(
      {
        error:
          "skillCategories must use Prosedur, Fakta / Teori, or Sikap / Keselamatan / Alam Sekitar.",
      },
      { status: 400 }
    );
  }

  const invalidDifficulties = (payload.difficultyLevels ?? []).filter(
    (level) => !requiredDifficultyLevels.includes(level)
  );

  if (invalidDifficulties.length > 0 || !payload.difficultyLevels?.length) {
    return NextResponse.json(
      {
        error:
          "difficultyLevels must use Aras Rendah, Aras Sederhana, or Aras Tinggi.",
      },
      { status: 400 }
    );
  }

  if (uploadedFiles.length === 0) {
    return NextResponse.json(
      { error: "Sila upload sekurang-kurangnya satu fail nota untuk AI jana soalan." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY belum dikonfigurasi. AI sebenar tidak boleh jana soalan tanpa API key.",
      },
      { status: 503 }
    );
  }

  const fileContent = await buildFileContent(uploadedFiles);

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.2",
      input: [
        {
          role: "user",
          content: [
            ...fileContent,
            {
              type: "input_text",
              text: buildPrompt(
                payload,
                uploadedFiles.map((file) => file.name)
              ),
            },
          ],
        },
      ],
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
