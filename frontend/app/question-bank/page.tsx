"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { AppShell } from "@/components/layouts/AppShell";

type QuestionType = "Objektif" | "Subjektif";
type Difficulty = "Rendah" | "Sederhana" | "Tinggi";
type SkillCategory =
  | "Prosedur"
  | "Fakta / Teori"
  | "Sikap"
  | "Keselamatan"
  | "Persekitaran";

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
};

type RubricItem = {
  criteria: string;
  marks: number;
  description: string;
};

type GeneratedQuestion = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  question: string;
  options?: string[];
  correctAnswer?: string;
  answerScheme?: string[] | string;
  rubric?: RubricItem[];
  rationale?: string;
  locked?: boolean;
};

type Analysis = {
  detectedTopics: string[];
  skillDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
};

const questionTypeOptions: QuestionType[] = ["Objektif", "Subjektif"];
const skillOptions: SkillCategory[] = [
  "Prosedur",
  "Fakta / Teori",
  "Sikap",
  "Keselamatan",
  "Persekitaran",
];
const difficultyOptions: Difficulty[] = ["Rendah", "Sederhana", "Tinggi"];

const initialAnalysis: Analysis = {
  detectedTopics: [],
  skillDistribution: {
    Prosedur: 0,
    "Fakta / Teori": 0,
    Sikap: 0,
    Keselamatan: 0,
    Persekitaran: 0,
  },
  difficultyDistribution: {
    Rendah: 30,
    Sederhana: 50,
    Tinggi: 20,
  },
};

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "purple" | "red" | "slate";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function StepTitle({ no, title }: { no: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {no}
      </span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toList(value?: string[] | string) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export default function QuestionBankPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    "Objektif",
    "Subjektif",
  ]);
  const [objectiveCount, setObjectiveCount] = useState(20);
  const [subjectiveCount, setSubjectiveCount] = useState(5);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>(skillOptions);
  const [difficultyDistribution, setDifficultyDistribution] = useState<Record<Difficulty, number>>({
    Rendah: 30,
    Sederhana: 50,
    Tinggi: 20,
  });
  const [generateAnswerScheme, setGenerateAnswerScheme] = useState(true);
  const [generateRubric, setGenerateRubric] = useState(true);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [analysis, setAnalysis] = useState<Analysis>(initialAnalysis);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"Semua" | QuestionType>("Semua");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const totalQuestions =
    (questionTypes.includes("Objektif") ? objectiveCount : 0) +
    (questionTypes.includes("Subjektif") ? subjectiveCount : 0);
  const difficultyTotal = Object.values(difficultyDistribution).reduce(
    (total, value) => total + value,
    0
  );
  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const matchesFilter = activeFilter === "Semua" || item.type === activeFilter;
      const matchesSearch =
        !searchTerm ||
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.skillCategory.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, questions, searchTerm]);

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const supported = Array.from(files).filter((file) =>
      [".pdf", ".docx", ".txt"].some((extension) =>
        file.name.toLowerCase().endsWith(extension)
      )
    );

    setUploadedFiles((current) => [
      ...current,
      ...supported.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split(".").pop()?.toUpperCase() || "FILE",
      })),
    ]);
  }

  function toggleQuestionType(type: QuestionType) {
    setQuestionTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  }

  function toggleSkill(category: SkillCategory) {
    setSkillCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function updateDifficulty(level: Difficulty, value: number) {
    setDifficultyDistribution((current) => ({
      ...current,
      [level]: Math.max(0, Math.min(100, value)),
    }));
  }

  async function generateQuestions() {
    setError("");

    if (questionTypes.length === 0) {
      setError("Pilih sekurang-kurangnya satu jenis soalan.");
      return;
    }

    if (skillCategories.length === 0) {
      setError("Pilih sekurang-kurangnya satu kategori keterampilan.");
      return;
    }

    if (difficultyTotal !== 100) {
      setError("Jumlah peratus aras soalan mesti tepat 100%.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/question-builder/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: uploadedFiles,
          questionTypes,
          objectiveCount,
          subjectiveCount,
          skillCategories,
          difficultyDistribution,
          generateAnswerScheme,
          generateRubric,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "AI gagal menjana soalan.");
      }

      const payload = (await response.json()) as {
        questions: GeneratedQuestion[];
        analysis: Analysis;
      };

      setQuestions(payload.questions);
      setAnalysis(payload.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI gagal menjana soalan.");
    } finally {
      setIsGenerating(false);
    }
  }

  function regenerateQuestion(id: string) {
    setQuestions((current) =>
      current.map((item) =>
        item.id === id && !item.locked
          ? {
              ...item,
              rationale:
                item.rationale ||
                "Soalan ini dijana semula berdasarkan tetapan semasa dan topik nota.",
            }
          : item
      )
    );
  }

  function deleteQuestion(id: string) {
    setQuestions((current) => current.filter((item) => item.id !== id));
  }

  function toggleLock(id: string) {
    setQuestions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, locked: !item.locked } : item
      )
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-blue-50 text-blue-600">
              <Sparkles className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bangunkan Soalan</h1>
              <p className="mt-1 text-sm text-slate-600">
                Hasilkan soalan berkualiti berdasarkan nota dan tetapan yang anda pilih.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Simpan Draf
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Muat Semula
            </button>
            <button
              onClick={generateQuestions}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Jana Soalan
            </button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_330px]">
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <StepTitle no={1} title="Upload Nota" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFiles(event.dataTransfer.files);
                }}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50"
              >
                <UploadCloud className="mx-auto h-8 w-8 text-blue-600" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Seret dan lepaskan fail di sini
                </p>
                <p className="text-xs text-slate-500">PDF, DOCX atau TXT</p>
                <span className="mt-3 inline-flex rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700">
                  Pilih Fail
                </span>
              </button>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-500">
                  Fail Dimuat Naik ({uploadedFiles.length})
                </p>
                {uploadedFiles.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    Belum ada fail dipilih.
                  </div>
                ) : (
                  uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                        <span className="truncate font-medium text-slate-700">{file.name}</span>
                      </div>
                      <span className="ml-3 shrink-0 text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={2} title="Jenis Soalan" />
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                {questionTypeOptions.map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type)}
                      onChange={() => toggleQuestionType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={3} title="Jumlah Soalan" />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-600">Objektif</span>
                  <input
                    type="number"
                    min={0}
                    value={objectiveCount}
                    disabled={!questionTypes.includes("Objektif")}
                    onChange={(event) => setObjectiveCount(Number(event.target.value))}
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100"
                  />
                  <span className="text-slate-500">soalan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-600">Subjektif</span>
                  <input
                    type="number"
                    min={0}
                    value={subjectiveCount}
                    disabled={!questionTypes.includes("Subjektif")}
                    onChange={(event) => setSubjectiveCount(Number(event.target.value))}
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100"
                  />
                  <span className="text-slate-500">soalan</span>
                </div>
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                  Jumlah Keseluruhan: {totalQuestions} soalan
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={4} title="Keterampilan Soalan" />
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                {skillOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={skillCategories.includes(item)}
                      onChange={() => toggleSkill(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={5} title="Aras Soalan" />
              <div className="space-y-3 text-sm">
                {difficultyOptions.map((level) => (
                  <div key={level} className="grid grid-cols-[78px_1fr_58px] items-center gap-2">
                    <span className="text-slate-600">{level}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={difficultyDistribution[level]}
                      onChange={(event) => updateDifficulty(level, Number(event.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={difficultyDistribution[level]}
                      onChange={(event) => updateDifficulty(level, Number(event.target.value))}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-right"
                    />
                  </div>
                ))}
                <div
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    difficultyTotal === 100
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  Jumlah peratus: {difficultyTotal}%{" "}
                  {difficultyTotal !== 100 && "(mesti 100%)"}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <StepTitle no={6} title="Skema Jawapan" />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-600">Jana skema jawapan secara automatik</p>
                  <Toggle
                    checked={generateAnswerScheme}
                    onChange={setGenerateAnswerScheme}
                    label="Jana Skema Jawapan"
                  />
                </div>
              </div>

              <div>
                <StepTitle no={7} title="Rubrik Jawapan" />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-600">Jana rubrik pemarkahan untuk subjektif</p>
                  <Toggle
                    checked={generateRubric}
                    onChange={setGenerateRubric}
                    label="Jana Rubrik Jawapan"
                  />
                </div>
              </div>
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2">
                {(["Semua", "Objektif", "Subjektif"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      activeFilter === filter
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {filter} (
                    {filter === "Semua"
                      ? questions.length
                      : questions.filter((item) => item.type === filter).length}
                    )
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm md:w-56"
                    placeholder="Cari soalan..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
                  Filter
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {isGenerating ? (
              <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  AI sedang menjana soalan...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tetapan keterampilan, aras, skema dan rubrik sedang diproses.
                </p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <Sparkles className="h-10 w-10 text-blue-600" />
                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  Belum ada soalan dijana
                </h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Muat naik nota, semak tetapan di sebelah kiri, kemudian klik Jana Soalan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">
                          Q{index + 1}
                        </span>
                        <Badge tone="slate">{item.type}</Badge>
                        <Badge
                          tone={
                            item.difficulty === "Tinggi"
                              ? "red"
                              : item.difficulty === "Sederhana"
                                ? "orange"
                                : "green"
                          }
                        >
                          Aras: {item.difficulty}
                        </Badge>
                        <Badge tone="purple">Keterampilan: {item.skillCategory}</Badge>
                        {item.locked && <Badge tone="blue">Locked</Badge>}
                      </div>

                      <div className="flex gap-2 text-slate-500">
                        <button title="Edit" className="rounded-lg p-2 hover:bg-slate-100">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          title="Regenerate"
                          onClick={() => regenerateQuestion(item.id)}
                          className="rounded-lg p-2 hover:bg-slate-100"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => deleteQuestion(item.id)}
                          className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          title="Lock"
                          onClick={() => toggleLock(item.id)}
                          className="rounded-lg p-2 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div>
                        <p className="text-sm font-medium leading-7 text-slate-800">
                          {item.question}
                        </p>

                        {item.type === "Objektif" && item.options?.length ? (
                          <div className="mt-4 space-y-3">
                            {item.options.map((option) => (
                              <div key={option} className="flex items-center gap-3 text-sm text-slate-700">
                                <span
                                  className={`h-4 w-4 rounded-full border ${
                                    option.startsWith(`${item.correctAnswer}.`)
                                      ? "border-green-500 bg-green-500"
                                      : "border-slate-300"
                                  }`}
                                />
                                {option}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold text-slate-700">Skema Jawapan</p>
                            <ul className="mt-2 space-y-1 text-sm text-slate-600">
                              {toList(item.answerScheme).map((scheme) => (
                                <li key={scheme}>- {scheme}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.correctAnswer && (
                          <div className="mt-4 inline-flex rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                            Jawapan: {item.correctAnswer}
                          </div>
                        )}

                        {item.type === "Subjektif" && item.rubric?.length ? (
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                            <div className="grid grid-cols-[1fr_70px_1.3fr] bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                              <span>Kriteria</span>
                              <span>Markah</span>
                              <span>Deskripsi</span>
                            </div>
                            {item.rubric.map((rubric) => (
                              <div
                                key={`${rubric.criteria}-${rubric.marks}`}
                                className="grid grid-cols-[1fr_70px_1.3fr] border-t border-slate-200 px-3 py-2 text-xs text-slate-600"
                              >
                                <span>{rubric.criteria}</span>
                                <span>{rubric.marks}</span>
                                <span>{rubric.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-blue-700">AI Rasional</p>
                        <p className="mt-2 text-xs leading-6 text-slate-600">
                          {item.rationale || "Rasional akan dipaparkan selepas skema dijana."}
                        </p>
                        {item.type === "Objektif" && toList(item.answerScheme).length > 0 && (
                          <div className="mt-4 border-t border-slate-200 pt-3">
                            <p className="text-xs font-bold text-slate-700">Skema</p>
                            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                              {toList(item.answerScheme).map((scheme) => (
                                <li key={scheme}>- {scheme}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Analisis AI Nota</h2>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="mb-3 flex justify-between">
                  <p className="text-sm font-bold text-slate-800">Topik Dikenal Pasti</p>
                  <button className="text-xs font-bold text-blue-600">Lihat Semua</button>
                </div>

                <div className="space-y-3">
                  {(analysis.detectedTopics.length
                    ? analysis.detectedTopics
                    : ["Topik akan dikenal pasti selepas AI menjana soalan."]
                  ).map((topic) => (
                    <div key={topic} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800">Taburan Keterampilan</p>
                <div className="mt-4 flex items-center gap-5">
                  <div className="h-28 w-28 shrink-0 rounded-full bg-[conic-gradient(#2563eb_0_35%,#f97316_35%_60%,#22c55e_60%_80%,#7c3aed_80%_90%,#eab308_90%_100%)]" />
                  <div className="space-y-2 text-xs text-slate-600">
                    {Object.entries(analysis.skillDistribution).map(([label, value]) => (
                      <p key={label}>
                        {label} - {value}%
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800">Taburan Aras Soalan</p>
                <div className="mt-4 space-y-3 text-sm">
                  {difficultyOptions.map((label) => {
                    const value =
                      analysis.difficultyDistribution[label] ?? difficultyDistribution[label];
                    const color =
                      label === "Rendah"
                        ? "bg-green-500"
                        : label === "Sederhana"
                          ? "bg-orange-500"
                          : "bg-red-500";

                    return (
                      <div key={label} className="grid grid-cols-[80px_1fr_45px] items-center gap-2">
                        <span className="text-slate-600">{label}</span>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{value}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Ringkasan Tetapan</h2>
              <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
                {[
                  ["Jumlah Soalan", String(totalQuestions)],
                  ["Objektif", questionTypes.includes("Objektif") ? String(objectiveCount) : "0"],
                  ["Subjektif", questionTypes.includes("Subjektif") ? String(subjectiveCount) : "0"],
                  ["Skema Jawapan", generateAnswerScheme ? "Diaktifkan" : "Dimatikan"],
                  ["Rubrik Jawapan", generateRubric ? "Diaktifkan" : "Dimatikan"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm hover:bg-blue-100">
              <p className="text-lg font-bold text-blue-700">Seterusnya</p>
              <p className="mt-1 text-sm text-blue-600">Semak Skema & Rubrik</p>
            </button>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
