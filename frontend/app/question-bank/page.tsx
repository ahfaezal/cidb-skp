"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";

type QuestionType = "Objektif" | "Subjektif";
type Difficulty = "Aras Rendah" | "Aras Sederhana" | "Aras Tinggi";
type ViewMode = "Builder" | "Document";
type QuestionLanguage = "Bahasa Melayu" | "English";
type SkillCategory =
  | "Prosedur"
  | "Fakta / Teori"
  | "Sikap / Keselamatan / Alam Sekitar";
type UserRole =
  | "Super Admin"
  | "Project Manager"
  | "Fasilitator"
  | "Pegawai CIDB"
  | "Pegawai Penilai"
  | "Ahli Panel Pembangun";
type DraftScope = "mine" | "project" | "all";

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

type QuestionFileRecord = {
  id?: string;
  name: string;
  size: number;
  type: string;
  storage?: {
    storage: string;
    bucket: string;
    region: string;
    key: string;
    url: string;
  } | null;
};

type RubricItem = {
  criteria: string;
  marks: number;
  description: string;
};

type GeneratedQuestion = {
  id: string;
  type: QuestionType;
  objectiveFormat?: "Soalan Satu (1) Pilihan" | "Soalan Aneka Gabungan";
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  question: string;
  combinationItems?: string[];
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

type SavedQuestionDraft = {
  id: number;
  title: string;
  ownerRef: string;
  ownerName: string;
  ownerRole: UserRole;
  projectRef: string;
  visibility: string;
  status: string;
  settings: {
    questionTypes?: QuestionType[];
    objectiveCount?: number;
    objectiveSingleCount?: number;
    objectiveCombinationCount?: number;
    subjectiveCount?: number;
    skillCategories?: SkillCategory[];
    difficultyLevels?: Difficulty[];
    language?: QuestionLanguage;
    generateAnswerScheme?: boolean;
    generateRubric?: boolean;
  };
  files: QuestionFileRecord[];
  questions: GeneratedQuestion[];
  analysis: Analysis;
  createdAt: string;
  updatedAt: string;
};

type UserProfile = {
  ownerRef: string;
  ownerName: string;
  ownerRole: UserRole;
  projectRef: string;
};

const questionTypeOptions: QuestionType[] = ["Objektif", "Subjektif"];
const languageOptions: QuestionLanguage[] = ["Bahasa Melayu", "English"];
const skillOptions: SkillCategory[] = [
  "Prosedur",
  "Fakta / Teori",
  "Sikap / Keselamatan / Alam Sekitar",
];
const difficultyOptions: Array<{ value: Difficulty; label: string }> = [
  { value: "Aras Rendah", label: "Aras Rendah" },
  { value: "Aras Sederhana", label: "Aras Sederhana" },
  { value: "Aras Tinggi", label: "Aras Tinggi" },
];
const objectiveCombinationOptions = [
  "A. I, II dan III",
  "B. I, II dan IV",
  "C. I, III dan IV",
  "D. II, III dan IV",
];
const roleOptions: UserRole[] = [
  "Super Admin",
  "Project Manager",
  "Fasilitator",
  "Pegawai CIDB",
  "Pegawai Penilai",
  "Ahli Panel Pembangun",
];
const defaultUserProfile: UserProfile = {
  ownerRef: "user-demo",
  ownerName: "Pengguna Demo",
  ownerRole: "Fasilitator",
  projectRef: "SKP-CIDB",
};
const feedbackQuestions = [
  {
    id: "generationProcess",
    label: "Adakah proses menjana soalan daripada nota berjalan lancar?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak"],
  },
  {
    id: "settingsClarity",
    label: "Adakah tetapan soalan mudah difahami?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak"],
  },
  {
    id: "groundedInNotes",
    label: "Adakah soalan yang dijana benar-benar berdasarkan nota yang dimuat naik?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak"],
  },
  {
    id: "difficultyAccuracy",
    label: "Adakah tahap aras soalan yang dijana sesuai dengan pilihan anda?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak"],
  },
  {
    id: "skillAccuracy",
    label: "Adakah kategori keterampilan soalan yang dijana tepat?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak"],
  },
  {
    id: "objectiveFormatFit",
    label: "Adakah format soalan objektif dan aneka gabungan menepati format yang anda perlukan?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak", "Tidak berkaitan"],
  },
  {
    id: "answerSchemeQuality",
    label: "Adakah skema jawapan yang dijana tepat dan mencukupi?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak", "Tidak berkaitan"],
  },
  {
    id: "rubricQuality",
    label: "Adakah rubrik jawapan subjektif sesuai untuk pemarkahan?",
    type: "choice",
    options: ["Ya", "Sebahagian", "Tidak", "Tidak berkaitan"],
  },
  {
    id: "mostHelpful",
    label: "Bahagian mana dalam proses pembangunan soalan yang paling memudahkan kerja anda?",
    type: "text",
  },
  {
    id: "hardestPart",
    label: "Bahagian mana yang masih menyukarkan kerja anda?",
    type: "text",
  },
  {
    id: "firstImprovement",
    label: "Apakah perkara pertama yang anda akan baiki dalam fungsi Question Bank ini?",
    type: "text",
  },
  {
    id: "mainAiIssue",
    label: "Jika AI menghasilkan soalan yang kurang memuaskan, apakah punca utamanya?",
    type: "choice",
    options: [
      "Tidak ikut nota",
      "Bahasa kurang tepat",
      "Aras soalan tidak tepat",
      "Keterampilan soalan tidak tepat",
      "Pilihan jawapan kurang berkualiti",
      "Skema jawapan tidak lengkap",
      "Rubrik tidak sesuai",
      "Format dokumen tidak menepati kehendak",
      "Lain-lain",
      "Tiada isu utama",
    ],
  },
  {
    id: "overallHelpfulness",
    label: "Secara keseluruhan, sejauh mana fungsi pembangunan soalan ini membantu kerja anda?",
    type: "rating",
    options: ["1", "2", "3", "4", "5"],
  },
];

const initialAnalysis: Analysis = {
  detectedTopics: [],
  skillDistribution: {
    Prosedur: 0,
    "Fakta / Teori": 0,
    "Sikap / Keselamatan / Alam Sekitar": 0,
  },
  difficultyDistribution: {
    "Aras Rendah": 0,
    "Aras Sederhana": 0,
    "Aras Tinggi": 0,
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

function getGenerationErrorMessage(payload: unknown) {
  const data = payload as { detail?: unknown; error?: unknown };
  const detail = data?.detail ?? data?.error;

  if (typeof detail === "string") {
    try {
      const parsed = JSON.parse(detail) as {
        error?: { message?: string };
        message?: string;
      };

      return parsed.error?.message || parsed.message || detail;
    } catch {
      return detail;
    }
  }

  if (detail) {
    return JSON.stringify(detail);
  }

  return "AI gagal menjana soalan.";
}

function getDocumentQuestionType(question: GeneratedQuestion) {
  if (question.type === "Subjektif") {
    return "Subjektif";
  }

  return question.objectiveFormat || "Soalan Satu (1) Pilihan";
}

function getDocumentTitle(files: Array<{ name: string }>) {
  const fileName = files[0]?.name.replace(/\.[^.]+$/, "") || "Bangunkan Soalan";
  return fileName.replace(/\s+-\s*\d+$/g, "");
}

function getDocumentTitleParts(files: Array<{ name: string }>) {
  const title = getDocumentTitle(files);
  const match = title.match(/^(PL\s*\d+)\s*[-:]?\s*(.*)$/i);
  const code = (match?.[1] || "PL01").replace(/\s+/g, "").toUpperCase();
  const name = match?.[2]?.trim() || title;

  return {
    code,
    displayTitle: `${code} - ${name}`,
  };
}

function getDocumentSkillCategory(category: SkillCategory) {
  return category === "Fakta / Teori" ? "Fakta/Teori" : category;
}

function getDocumentDifficulty(difficulty: Difficulty) {
  return difficulty.replace("Aras ", "");
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitOption(option: string) {
  const match = option.match(/^([A-D])\.\s*(.*)$/i);
  return {
    label: match?.[1]?.toUpperCase() || "",
    text: (match?.[2] || option).trim(),
  };
}

function splitRomanItem(item: string) {
  const match = item.match(/^(I|II|III|IV)\.\s*(.*)$/i);
  return {
    label: match?.[1]?.toUpperCase() || "",
    text: (match?.[2] || item).trim(),
  };
}

function normalizeCombinationItems(items: string[] = []) {
  const romanLabels = ["I", "II", "III", "IV"];
  return [...items]
    .map(splitRomanItem)
    .sort((a, b) => {
      const lengthDiff = a.text.length - b.text.length;
      return lengthDiff || a.text.localeCompare(b.text);
    })
    .slice(0, 4)
    .map((item, index) => `${romanLabels[index]}. ${item.text}`);
}

function normalizeObjectiveOptions(question: GeneratedQuestion): GeneratedQuestion {
  if (question.type !== "Objektif") {
    return question;
  }

  if (
    question.objectiveFormat === "Soalan Aneka Gabungan" ||
    question.combinationItems?.length
  ) {
    return {
      ...question,
      objectiveFormat: "Soalan Aneka Gabungan",
      combinationItems: normalizeCombinationItems(question.combinationItems),
      options: objectiveCombinationOptions,
    };
  }

  if (!question.options?.length) {
    return question;
  }

  const parsed = question.options.map((option, index) => ({
    ...splitOption(option),
    fallbackLabel: String.fromCharCode(65 + index),
  }));
  const correctText = parsed.find(
    (option) =>
      option.label === question.correctAnswer ||
      option.fallbackLabel === question.correctAnswer,
  )?.text;
  const sorted = [...parsed].sort((a, b) => {
    const lengthDiff = a.text.length - b.text.length;
    return lengthDiff || a.text.localeCompare(b.text);
  });
  const labels = ["A", "B", "C", "D"];
  const nextOptions = sorted.map((option, index) => `${labels[index]}. ${option.text}`);
  const nextCorrectIndex = correctText
    ? sorted.findIndex((option) => option.text === correctText)
    : -1;

  return {
    ...question,
    options: nextOptions,
    correctAnswer: nextCorrectIndex >= 0 ? labels[nextCorrectIndex] : question.correctAnswer,
  };
}

function normalizeQuestions(items: GeneratedQuestion[]) {
  return items.map(normalizeObjectiveOptions);
}

export default function QuestionBankPage() {
  const { authHeaders, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatedFileRecords, setGeneratedFileRecords] = useState<QuestionFileRecord[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    "Objektif",
    "Subjektif",
  ]);
  const [objectiveCount, setObjectiveCount] = useState(20);
  const [objectiveSingleCount, setObjectiveSingleCount] = useState(20);
  const [objectiveCombinationCount, setObjectiveCombinationCount] = useState(0);
  const [subjectiveCount, setSubjectiveCount] = useState(5);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>(skillOptions);
  const [difficultyLevels, setDifficultyLevels] = useState<Difficulty[]>(
    difficultyOptions.map(({ value }) => value)
  );
  const [language, setLanguage] = useState<QuestionLanguage>("Bahasa Melayu");
  const [generateAnswerScheme, setGenerateAnswerScheme] = useState(true);
  const [generateRubric, setGenerateRubric] = useState(true);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [analysis, setAnalysis] = useState<Analysis>(initialAnalysis);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"Semua" | QuestionType>("Semua");
  const [viewMode, setViewMode] = useState<ViewMode>("Builder");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedQuestionDraft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [error, setError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackResponses, setFeedbackResponses] = useState<Record<string, string>>({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window === "undefined") {
      return defaultUserProfile;
    }

    const savedProfile = window.localStorage.getItem("skpQuestionUserProfile");
    if (!savedProfile) {
      return defaultUserProfile;
    }

    try {
      return { ...defaultUserProfile, ...JSON.parse(savedProfile) };
    } catch {
      window.localStorage.removeItem("skpQuestionUserProfile");
      return defaultUserProfile;
    }
  });
  const [draftScope, setDraftScope] = useState<DraftScope>("mine");

  const totalQuestions =
    (questionTypes.includes("Objektif") ? objectiveCount : 0) +
    (questionTypes.includes("Subjektif") ? subjectiveCount : 0);
  const objectiveBreakdownTotal = objectiveSingleCount + objectiveCombinationCount;
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
  const draftUserSummary = useMemo(() => {
    const summary = new Map<
      string,
      {
        ownerName: string;
        ownerRole: UserRole;
        projectRef: string;
        draftCount: number;
        questionCount: number;
        latestUpdate: string;
      }
    >();

    savedDrafts.forEach((draft) => {
      const key = draft.ownerRef || `${draft.ownerName}-${draft.projectRef}`;
      const current =
        summary.get(key) ||
        {
          ownerName: draft.ownerName || draft.ownerRef || "Pengguna",
          ownerRole: draft.ownerRole,
          projectRef: draft.projectRef || "-",
          draftCount: 0,
          questionCount: 0,
          latestUpdate: draft.updatedAt || draft.createdAt,
        };

      current.draftCount += 1;
      current.questionCount += draft.questions.length;
      if (
        (draft.updatedAt || draft.createdAt) &&
        (!current.latestUpdate ||
          new Date(draft.updatedAt || draft.createdAt) > new Date(current.latestUpdate))
      ) {
        current.latestUpdate = draft.updatedAt || draft.createdAt;
      }

      summary.set(key, current);
    });

    return Array.from(summary.values()).sort(
      (a, b) => b.questionCount - a.questionCount || b.draftCount - a.draftCount,
    );
  }, [savedDrafts]);
  const activeFileRecords: QuestionFileRecord[] = generatedFileRecords.length
    ? generatedFileRecords
    : uploadedFiles.map(({ id, name, size, type }) => ({
        id,
        name,
        size,
        type,
        storage: null,
      }));
  const effectiveUserProfile: UserProfile = useMemo(
    () =>
      user
        ? {
            ownerRef: String(user.id),
            ownerName: user.name,
            ownerRole: user.role,
            projectRef: user.projectRef,
          }
        : userProfile,
    [user, userProfile],
  );

  const loadSavedDrafts = useCallback(async (
    profile: UserProfile = effectiveUserProfile,
    scope: DraftScope = draftScope,
  ) => {
    setIsLoadingDrafts(true);

    try {
      const params = new URLSearchParams({
        ownerRef: profile.ownerRef,
        ownerRole: profile.ownerRole,
        projectRef: profile.projectRef,
        scope,
      });
      const response = await fetch(
        `${API_BASE_URL}/question-builder/drafts?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!response.ok) return;

      setSavedDrafts((await response.json()) as SavedQuestionDraft[]);
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [authHeaders, draftScope, effectiveUserProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSavedDrafts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSavedDrafts]);

  function saveUserProfile() {
    window.localStorage.setItem(
      "skpQuestionUserProfile",
      JSON.stringify(userProfile),
    );
    setDraftMessage("Profil pengguna disimpan untuk browser ini.");
    loadSavedDrafts(userProfile, draftScope);
  }

  function loadDraft(draft: SavedQuestionDraft) {
    setQuestions(normalizeQuestions(draft.questions));
    setAnalysis(draft.analysis || initialAnalysis);
    setQuestionTypes(draft.settings.questionTypes?.length ? draft.settings.questionTypes : questionTypeOptions);
    setObjectiveCount(draft.settings.objectiveCount ?? 0);
    setObjectiveSingleCount(
      draft.settings.objectiveSingleCount ?? draft.settings.objectiveCount ?? 0,
    );
    setObjectiveCombinationCount(draft.settings.objectiveCombinationCount ?? 0);
    setSubjectiveCount(draft.settings.subjectiveCount ?? 0);
    setSkillCategories(draft.settings.skillCategories?.length ? draft.settings.skillCategories : skillOptions);
    setDifficultyLevels(
      draft.settings.difficultyLevels?.length
        ? draft.settings.difficultyLevels
        : difficultyOptions.map(({ value }) => value),
    );
    setLanguage(draft.settings.language || "Bahasa Melayu");
    setGenerateAnswerScheme(draft.settings.generateAnswerScheme ?? true);
    setGenerateRubric(draft.settings.generateRubric ?? true);
    setGeneratedFileRecords(draft.files || []);
    setUploadedFiles([]);
    setViewMode("Builder");
    setDraftMessage(`Draf ID ${draft.id} dimuat semula.`);
  }

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
        file,
      })),
    ]);
    setGeneratedFileRecords([]);
  }

  function toggleQuestionType(type: QuestionType) {
    setQuestionTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  }

  function updateObjectiveCount(value: number) {
    const nextValue = Math.max(0, value);
    const nextCombination = Math.min(objectiveCombinationCount, nextValue);
    setObjectiveCount(nextValue);
    setObjectiveCombinationCount(nextCombination);
    setObjectiveSingleCount(nextValue - nextCombination);
  }

  function updateObjectiveSingleCount(value: number) {
    const nextSingle = Math.min(Math.max(0, value), objectiveCount);
    setObjectiveSingleCount(nextSingle);
    setObjectiveCombinationCount(objectiveCount - nextSingle);
  }

  function updateObjectiveCombinationCount(value: number) {
    const nextCombination = Math.min(Math.max(0, value), objectiveCount);
    setObjectiveCombinationCount(nextCombination);
    setObjectiveSingleCount(objectiveCount - nextCombination);
  }

  function toggleSkill(category: SkillCategory) {
    setSkillCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function toggleDifficulty(level: Difficulty) {
    setDifficultyLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level]
    );
  }

  async function generateQuestions() {
    setError("");
    setDraftMessage("");

    if (questionTypes.length === 0) {
      setError("Pilih sekurang-kurangnya satu jenis soalan.");
      return;
    }

    if (
      questionTypes.includes("Objektif") &&
      objectiveBreakdownTotal !== objectiveCount
    ) {
      setError("Jumlah pecahan objektif mesti sama dengan jumlah soalan objektif.");
      return;
    }

    if (skillCategories.length === 0) {
      setError("Pilih sekurang-kurangnya satu kategori keterampilan.");
      return;
    }

    if (difficultyLevels.length === 0) {
      setError("Pilih sekurang-kurangnya satu aras soalan.");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("ownerRef", effectiveUserProfile.ownerRef);
      formData.append(
        "settings",
        JSON.stringify({
          files: uploadedFiles.map(({ id, name, size, type }) => ({
            id,
            name,
            size,
            type,
          })),
          questionTypes,
          objectiveCount: questionTypes.includes("Objektif") ? objectiveCount : 0,
          objectiveSingleCount: questionTypes.includes("Objektif") ? objectiveSingleCount : 0,
          objectiveCombinationCount: questionTypes.includes("Objektif") ? objectiveCombinationCount : 0,
          subjectiveCount: questionTypes.includes("Subjektif") ? subjectiveCount : 0,
          skillCategories,
          difficultyLevels,
          language,
          generateAnswerScheme,
          generateRubric,
        })
      );

      uploadedFiles.forEach((item) => {
        formData.append("files", item.file, item.name);
      });

      const response = await fetch(`${API_BASE_URL}/question-builder/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getGenerationErrorMessage(payload));
      }

      const payload = (await response.json()) as {
        questions: GeneratedQuestion[];
        analysis: Analysis;
        files?: QuestionFileRecord[];
      };

      setQuestions(normalizeQuestions(payload.questions));
      setAnalysis(payload.analysis);
      setGeneratedFileRecords(payload.files || []);
      setViewMode("Builder");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI gagal menjana soalan.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveDraft() {
    setError("");
    setDraftMessage("");

    if (questions.length === 0) {
      setError("Tiada soalan untuk disimpan sebagai draf.");
      return;
    }

    setIsSavingDraft(true);

    try {
      const settings = {
        questionTypes,
        objectiveCount: questionTypes.includes("Objektif") ? objectiveCount : 0,
        objectiveSingleCount: questionTypes.includes("Objektif") ? objectiveSingleCount : 0,
        objectiveCombinationCount: questionTypes.includes("Objektif") ? objectiveCombinationCount : 0,
        subjectiveCount: questionTypes.includes("Subjektif") ? subjectiveCount : 0,
        skillCategories,
        difficultyLevels,
        language,
        generateAnswerScheme,
        generateRubric,
      };
      const response = await fetch(`${API_BASE_URL}/question-builder/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: getDocumentTitle(activeFileRecords),
          ownerRef: user ? String(user.id) : effectiveUserProfile.ownerRef,
          ownerName: user?.name || effectiveUserProfile.ownerName,
          ownerRole: user?.role || effectiveUserProfile.ownerRole,
          projectRef: user?.projectRef || effectiveUserProfile.projectRef,
          visibility: draftScope === "project" ? "Project" : "Private",
          status: "Draft",
          settings,
          files: activeFileRecords,
          questions: normalizeQuestions(questions),
          analysis,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getGenerationErrorMessage(payload));
      }

      const payload = (await response.json()) as { id: number; message: string };
      setDraftMessage(`${payload.message} ID Draf: ${payload.id}`);
      await loadSavedDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal simpan draf.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  function startEditQuestion(item: GeneratedQuestion) {
    if (item.locked) {
      setError("Soalan dikunci. Buka lock sebelum edit.");
      return;
    }

    setError("");
    setEditingQuestionId(item.id);
    setEditingQuestion({
      ...item,
      options: item.options ? [...item.options] : [],
      combinationItems: item.combinationItems ? [...item.combinationItems] : [],
      answerScheme: Array.isArray(item.answerScheme)
        ? [...item.answerScheme]
        : item.answerScheme || "",
      rubric: item.rubric ? item.rubric.map((rubric) => ({ ...rubric })) : [],
    });
  }

  function updateEditingQuestion(changes: Partial<GeneratedQuestion>) {
    setEditingQuestion((current) => (current ? { ...current, ...changes } : current));
  }

  function updateEditingOption(index: number, value: string) {
    setEditingQuestion((current) => {
      if (!current) return current;
      const options = [...(current.options || [])];
      const label = String.fromCharCode(65 + index);
      const text = splitOption(value).text;
      options[index] = `${label}. ${text}`;
      return { ...current, options };
    });
  }

  function updateEditingCombinationItem(index: number, value: string) {
    setEditingQuestion((current) => {
      if (!current) return current;
      const romanLabels = ["I", "II", "III", "IV"];
      const combinationItems = [...(current.combinationItems || [])];
      combinationItems[index] = `${romanLabels[index]}. ${splitRomanItem(value).text}`;
      return { ...current, combinationItems };
    });
  }

  function saveEditedQuestion() {
    if (!editingQuestion || !editingQuestionId) return;

    const normalized = normalizeObjectiveOptions(editingQuestion);
    setQuestions((current) =>
      current.map((item) => (item.id === editingQuestionId ? normalized : item)),
    );
    setEditingQuestion(null);
    setEditingQuestionId("");
    setDraftMessage("Soalan berjaya dikemaskini. Tekan Simpan Draf untuk simpan ke database.");
  }

  function cancelEditQuestion() {
    setEditingQuestion(null);
    setEditingQuestionId("");
  }

  async function regenerateQuestion(id: string) {
    setError("");
    setDraftMessage("");

    const original = questions.find((item) => item.id === id);
    if (!original || original.locked) {
      setError("Soalan dikunci. Buka lock sebelum regenerate.");
      return;
    }

    if (uploadedFiles.length === 0) {
      setError("Regenerate perlukan fail nota asal. Muat naik nota semula jika draf dimuat daripada database.");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("ownerRef", effectiveUserProfile.ownerRef);
      formData.append(
        "settings",
        JSON.stringify({
          files: uploadedFiles.map(({ id: fileId, name, size, type }) => ({
            id: fileId,
            name,
            size,
            type,
          })),
          questionTypes: [original.type],
          objectiveCount: original.type === "Objektif" ? 1 : 0,
          objectiveSingleCount:
            original.type === "Objektif" && original.objectiveFormat !== "Soalan Aneka Gabungan" ? 1 : 0,
          objectiveCombinationCount:
            original.type === "Objektif" && original.objectiveFormat === "Soalan Aneka Gabungan" ? 1 : 0,
          subjectiveCount: original.type === "Subjektif" ? 1 : 0,
          skillCategories: [original.skillCategory],
          difficultyLevels: [original.difficulty],
          language,
          generateAnswerScheme,
          generateRubric,
        }),
      );

      uploadedFiles.forEach((file) => {
        formData.append("files", file.file, file.name);
      });

      const response = await fetch(`${API_BASE_URL}/question-builder/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getGenerationErrorMessage(payload));
      }

      const payload = (await response.json()) as {
        questions: GeneratedQuestion[];
        analysis?: Analysis;
      };
      const nextQuestion = payload.questions[0];
      if (!nextQuestion) {
        throw new Error("AI tidak memulangkan soalan gantian.");
      }
      const replacement = normalizeObjectiveOptions(nextQuestion);

      setQuestions((current) =>
        current.map((item) => (item.id === id ? { ...replacement, id } : item)),
      );
      setDraftMessage("Soalan berjaya dijana semula. Tekan Simpan Draf untuk simpan ke database.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate soalan gagal.");
    } finally {
      setIsGenerating(false);
    }
  }

  function deleteQuestion(id: string) {
    const target = questions.find((item) => item.id === id);
    if (target?.locked) {
      setError("Soalan dikunci. Buka lock sebelum delete.");
      return;
    }

    setError("");
    setQuestions((current) =>
      current.filter((item) => item.id !== id).map((item, index) => ({ ...item, id: `q${index + 1}` })),
    );
  }

  function toggleLock(id: string) {
    setError("");
    setQuestions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, locked: !item.locked } : item
      )
    );
  }

  function updateFeedbackResponse(id: string, value: string) {
    setFeedbackResponses((current) => ({
      ...current,
      [id]: value,
    }));
  }

  async function submitFeedback() {
    setError("");
    setDraftMessage("");

    const missingQuestion = feedbackQuestions.find(
      (question) => !feedbackResponses[question.id]?.trim(),
    );
    if (missingQuestion) {
      setError("Sila lengkapkan semua soalan feedback sebelum hantar.");
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const response = await fetch(`${API_BASE_URL}/question-feedback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ responses: feedbackResponses }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || "Feedback gagal dihantar.");
      }

      setFeedbackResponses({});
      setIsFeedbackOpen(false);
      setDraftMessage("Terima kasih. Feedback penggunaan Question Bank berjaya dihantar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback gagal dihantar.");
    } finally {
      setIsSubmittingFeedback(false);
    }
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
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
            >
              <MessageSquare className="h-4 w-4" />
              Feedback
            </button>
            <button
              onClick={saveDraft}
              disabled={isSavingDraft || questions.length === 0}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingDraft ? "Menyimpan..." : "Simpan Draf"}
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
              <StepTitle no={0} title="Profil Pengguna" />
              {user && (
                <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  Profil dikawal oleh akaun login.
                </p>
              )}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600">
                  Nama pengguna
                  <input
                    value={effectiveUserProfile.ownerName}
                    disabled={Boolean(user)}
                    onChange={(event) =>
                      setUserProfile((current) => ({
                        ...current,
                        ownerName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  ID pengguna
                  <input
                    value={effectiveUserProfile.ownerRef}
                    disabled={Boolean(user)}
                    onChange={(event) =>
                      setUserProfile((current) => ({
                        ...current,
                        ownerRef: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  Peranan
                  <select
                    value={effectiveUserProfile.ownerRole}
                    disabled={Boolean(user)}
                    onChange={(event) =>
                      setUserProfile((current) => ({
                        ...current,
                        ownerRole: event.target.value as UserRole,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    {roleOptions.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  Projek / batch
                  <input
                    value={effectiveUserProfile.projectRef}
                    disabled={Boolean(user)}
                    onChange={(event) =>
                      setUserProfile((current) => ({
                        ...current,
                        projectRef: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveUserProfile}
                  disabled={Boolean(user)}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Simpan Profil
                </button>
              </div>
            </div>

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
                  Fail Nota ({activeFileRecords.length})
                </p>
                {activeFileRecords.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    Belum ada fail dipilih.
                  </div>
                ) : (
                  activeFileRecords.map((file) => (
                    <div
                      key={file.id || file.name}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                        <span className="truncate font-medium text-slate-700">
                          {file.name}
                        </span>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {file.storage?.key && (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                            S3
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={2} title="Bahasa Soalan" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {languageOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLanguage(option)}
                    className={`rounded-xl border px-3 py-2 font-bold transition ${
                      language === option
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
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
                    onChange={(event) => updateObjectiveCount(Number(event.target.value))}
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
              <StepTitle no={4} title="Jenis Soalan" />
              <div className="grid gap-4 text-sm text-slate-700">
                {questionTypeOptions.map((type) => (
                  <div key={type} className="rounded-xl border border-slate-200 bg-white p-3">
                    <label className="flex items-center gap-2 font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={questionTypes.includes(type)}
                        onChange={() => toggleQuestionType(type)}
                      />
                      {type}
                    </label>

                    {type === "Objektif" && questionTypes.includes("Objektif") ? (
                      <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-600">
                            Soalan Satu (1) Pilihan
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={objectiveCount}
                            value={objectiveSingleCount}
                            onChange={(event) =>
                              updateObjectiveSingleCount(Number(event.target.value))
                            }
                            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-600">
                            Soalan Aneka Gabungan
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={objectiveCount}
                            value={objectiveCombinationCount}
                            onChange={(event) =>
                              updateObjectiveCombinationCount(Number(event.target.value))
                            }
                            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div
                          className={`rounded-lg px-3 py-2 text-xs font-bold ${
                            objectiveBreakdownTotal === objectiveCount
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          Pecahan Objektif: {objectiveBreakdownTotal} / {objectiveCount} soalan
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={5} title="Keterampilan Soalan" />
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
              <StepTitle no={6} title="Aras Soalan" />
              <div className="grid gap-3 text-sm text-slate-700">
                {difficultyOptions.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={difficultyLevels.includes(value)}
                      onChange={() => toggleDifficulty(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <StepTitle no={7} title="Skema Jawapan" />
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
                <StepTitle no={8} title="Rubrik Jawapan" />
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
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["Builder", "Document"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                        viewMode === mode
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      {mode} Mode
                    </button>
                  ))}
                </div>
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
            {draftMessage && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {draftMessage}
              </div>
            )}

            {viewMode === "Document" && questions.length > 0 ? (
              <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
                <div className="mx-auto min-h-[1123px] w-[794px] bg-white px-[66px] py-[72px] text-black shadow-sm">
                  <div className="space-y-8 font-serif text-[16px] leading-[1.35]">
                    {filteredQuestions.map((item, index) => {
                      const documentTitle = getDocumentTitleParts(activeFileRecords);

                      return (
                        <section key={item.id} className="break-inside-avoid">
                          <div className="grid grid-cols-[100px_118px_minmax(0,1fr)_76px_106px] border border-black bg-[#d9d9d9] text-center text-[12px] font-bold uppercase leading-tight">
                            <div className="flex min-h-11 items-center justify-center border-r border-black px-1 py-1">
                              JENIS<br />SOALAN
                            </div>
                            <div className="flex min-h-11 items-center justify-center border-r border-black px-1 py-1">
                              KETERAMPILAN
                            </div>
                            <div className="flex min-h-11 items-center justify-center border-r border-black px-1 py-1">
                              NO. &amp; TAJUK
                            </div>
                            <div className="flex min-h-11 items-center justify-center border-r border-black px-1 py-1">
                              NO. SUB<br />MODUL
                            </div>
                            <div className="flex min-h-11 items-center justify-center px-1 py-1">
                              ARAS<br />KESUKARAN
                            </div>
                          </div>
                          <div className="grid grid-cols-[100px_118px_minmax(0,1fr)_76px_106px] border-x border-b border-black text-center text-[12px] font-bold leading-tight">
                            <div className="flex min-h-24 items-start justify-center border-r border-black px-2 py-3">
                              {getDocumentQuestionType(item)}
                            </div>
                            <div className="flex min-h-24 items-start justify-center border-r border-black px-2 py-3">
                              {getDocumentSkillCategory(item.skillCategory)}
                            </div>
                            <div className="flex min-h-24 items-start justify-center border-r border-black px-3 py-3">
                              {documentTitle.displayTitle}
                            </div>
                            <div className="flex min-h-24 items-start justify-center border-r border-black px-2 py-3">
                              {documentTitle.code}
                            </div>
                            <div className="flex min-h-24 items-start justify-center px-2 py-3">
                              {getDocumentDifficulty(item.difficulty)}
                            </div>
                          </div>

                          <div className="mt-5 text-[16px] font-bold">
                            <div className="grid grid-cols-[18px_1fr] gap-2">
                              <span>{index + 1}.</span>
                              <p>{item.question}</p>
                            </div>

                            {item.type === "Objektif" && item.options?.length ? (
                              <>
                                {item.objectiveFormat === "Soalan Aneka Gabungan" && item.combinationItems?.length ? (
                                  <div className="mt-5 grid gap-2 pl-9">
                                    {item.combinationItems.map((combinationItem) => {
                                      const parsed = splitRomanItem(combinationItem);

                                      return (
                                        <div
                                          key={combinationItem}
                                          className="grid grid-cols-[32px_1fr] gap-2"
                                        >
                                          <span>{parsed.label}.</span>
                                          <span>{parsed.text}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}
                                <div className="mt-5 grid gap-4 pl-9">
                                  {item.options.map((option) => {
                                    const parsed = splitOption(option);

                                    return (
                                      <div key={option} className="grid grid-cols-[22px_1fr] gap-2">
                                        <span>{parsed.label}.</span>
                                        <span>{parsed.text}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="mt-8 min-h-24 border-b border-dotted border-slate-500" />
                            )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isGenerating ? (
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
                            item.difficulty === "Aras Tinggi"
                              ? "red"
                              : item.difficulty === "Aras Sederhana"
                                ? "orange"
                                : "green"
                          }
                        >
                          {item.difficulty}
                        </Badge>
                        <Badge tone="purple">Keterampilan: {item.skillCategory}</Badge>
                        {item.locked && <Badge tone="blue">Locked</Badge>}
                      </div>

                      <div className="flex gap-2 text-slate-500">
                        <button
                          title="Edit"
                          onClick={() => startEditQuestion(item)}
                          disabled={item.locked}
                          className="rounded-lg p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          title="Regenerate"
                          onClick={() => regenerateQuestion(item.id)}
                          disabled={item.locked || isGenerating}
                          className="rounded-lg p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => deleteQuestion(item.id)}
                          disabled={item.locked}
                          className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          title={item.locked ? "Unlock" : "Lock"}
                          onClick={() => toggleLock(item.id)}
                          className={`rounded-lg p-2 hover:bg-blue-50 hover:text-blue-600 ${
                            item.locked ? "bg-blue-50 text-blue-600" : ""
                          }`}
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div>
                        {editingQuestionId === item.id && editingQuestion ? (
                          <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                            <label className="block text-xs font-bold text-slate-700">
                              Soalan
                              <textarea
                                value={editingQuestion.question}
                                onChange={(event) =>
                                  updateEditingQuestion({ question: event.target.value })
                                }
                                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400"
                              />
                            </label>

                            {editingQuestion.type === "Objektif" && (
                              <div className="grid gap-3">
                                {editingQuestion.objectiveFormat === "Soalan Aneka Gabungan" ? (
                                  <>
                                    <p className="text-xs font-bold text-slate-700">
                                      Item gabungan I-IV, sistem akan susun semula daripada pendek ke panjang. Pilihan A-D kekal.
                                    </p>
                                    {(editingQuestion.combinationItems || []).map((itemValue, itemIndex) => (
                                      <label
                                        key={`${editingQuestion.id}-combination-${itemIndex}`}
                                        className="grid gap-2 text-xs font-bold text-slate-700"
                                      >
                                        Item {["I", "II", "III", "IV"][itemIndex]}
                                        <input
                                          value={splitRomanItem(itemValue).text}
                                          onChange={(event) =>
                                            updateEditingCombinationItem(itemIndex, event.target.value)
                                          }
                                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400"
                                        />
                                      </label>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-bold text-slate-700">
                                      Pilihan jawapan, sistem akan susun semula dari pendek ke panjang apabila disimpan.
                                    </p>
                                    {(editingQuestion.options || []).map((option, optionIndex) => (
                                      <label
                                        key={`${editingQuestion.id}-option-${optionIndex}`}
                                        className="grid gap-2 text-xs font-bold text-slate-700"
                                      >
                                        Pilihan {String.fromCharCode(65 + optionIndex)}
                                        <input
                                          value={splitOption(option).text}
                                          onChange={(event) =>
                                            updateEditingOption(optionIndex, event.target.value)
                                          }
                                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400"
                                        />
                                      </label>
                                    ))}
                                  </>
                                )}
                                <label className="block text-xs font-bold text-slate-700">
                                  Jawapan betul
                                  <select
                                    value={editingQuestion.correctAnswer || "A"}
                                    onChange={(event) =>
                                      updateEditingQuestion({ correctAnswer: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                                  >
                                    {["A", "B", "C", "D"].map((label) => (
                                      <option key={label}>{label}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            )}

                            <label className="block text-xs font-bold text-slate-700">
                              Rasional
                              <textarea
                                value={editingQuestion.rationale || ""}
                                onChange={(event) =>
                                  updateEditingQuestion({ rationale: event.target.value })
                                }
                                className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400"
                              />
                            </label>

                            <label className="block text-xs font-bold text-slate-700">
                              Skema Jawapan
                              <textarea
                                value={toList(editingQuestion.answerScheme).join("\n")}
                                onChange={(event) =>
                                  updateEditingQuestion({
                                    answerScheme: event.target.value
                                      .split("\n")
                                      .map((line) => line.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400"
                              />
                            </label>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={saveEditedQuestion}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                              >
                                Simpan Edit
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditQuestion}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium leading-7 text-slate-800">
                              {item.question}
                            </p>

                            {item.type === "Objektif" && item.options?.length ? (
                              <div className="mt-4 space-y-3">
                                {item.objectiveFormat === "Soalan Aneka Gabungan" && item.combinationItems?.length ? (
                                  <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-4">
                                    {item.combinationItems.map((combinationItem) => (
                                      <p key={combinationItem} className="text-sm text-slate-700">
                                        {combinationItem}
                                      </p>
                                    ))}
                                  </div>
                                ) : null}
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
                          </>
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
                  {difficultyOptions.map(({ value: label, label: displayLabel }) => {
                    const value =
                      analysis.difficultyDistribution[label] ??
                      (difficultyLevels.includes(label) ? 1 : 0);
                    const color =
                      label === "Aras Rendah"
                        ? "bg-green-500"
                        : label === "Aras Sederhana"
                          ? "bg-orange-500"
                          : "bg-red-500";

                    return (
                      <div key={label} className="grid grid-cols-[112px_1fr_45px] items-center gap-2">
                        <span className="text-slate-600">{displayLabel}</span>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${color}`}
                            style={{ width: `${Math.min(100, value)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {value > 0 ? `${value}%` : "-"}
                        </span>
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
                  ["Pengguna", effectiveUserProfile.ownerName || "-"],
                  ["Peranan", effectiveUserProfile.ownerRole],
                  ["Projek", effectiveUserProfile.projectRef || "-"],
                  ["Fail Nota", activeFileRecords.length ? `${activeFileRecords.length} fail` : "Belum dipilih"],
                  ["Bahasa", language],
                  ["Jenis Soalan", questionTypes.join(", ") || "-"],
                  ["Jumlah Soalan", String(totalQuestions)],
                  ["Objektif", questionTypes.includes("Objektif") ? String(objectiveCount) : "0"],
                  ["Satu Pilihan", questionTypes.includes("Objektif") ? String(objectiveSingleCount) : "0"],
                  ["Aneka Gabungan", questionTypes.includes("Objektif") ? String(objectiveCombinationCount) : "0"],
                  ["Subjektif", questionTypes.includes("Subjektif") ? String(subjectiveCount) : "0"],
                  ["Keterampilan", skillCategories.join(", ") || "-"],
                  ["Aras Soalan", difficultyLevels.join(", ") || "-"],
                  ["Skema Jawapan", generateAnswerScheme ? "Diaktifkan" : "Dimatikan"],
                  ["Rubrik Jawapan", generateRubric ? "Diaktifkan" : "Dimatikan"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[94px_1fr] gap-3">
                    <span className="text-slate-600">{label}</span>
                    <span className="text-right font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">Draf Tersimpan</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {savedDrafts.length} draf
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                <select
                  value={draftScope}
                  onChange={(event) => setDraftScope(event.target.value as DraftScope)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
                >
                  <option value="mine">Draf saya sahaja</option>
                  <option value="project">Semua draf projek ini</option>
                  <option value="all" disabled={effectiveUserProfile.ownerRole !== "Super Admin"}>
                    Semua draf sistem
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => loadSavedDrafts()}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  Muat Semula Draf
                </button>
                {draftScope === "all" && effectiveUserProfile.ownerRole !== "Super Admin" ? (
                  <p className="text-xs font-semibold text-red-600">
                    Paparan semua draf hanya untuk Super Admin.
                  </p>
                ) : null}
              </div>

              {draftScope === "all" && effectiveUserProfile.ownerRole === "Super Admin" ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <div className="grid grid-cols-[minmax(120px,1.2fr)_70px_80px_minmax(90px,1fr)_105px] bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase text-slate-700">
                    <span>Pengguna</span>
                    <span className="text-center">Draf</span>
                    <span className="text-center">Soalan</span>
                    <span>Projek</span>
                    <span>Kemaskini</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {draftUserSummary.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">
                        Tiada ringkasan pengguna lagi.
                      </p>
                    ) : (
                      draftUserSummary.map((item) => (
                        <div
                          key={`${item.ownerName}-${item.projectRef}`}
                          className="grid grid-cols-[minmax(120px,1.2fr)_70px_80px_minmax(90px,1fr)_105px] border-t border-slate-200 px-3 py-2 text-xs text-slate-700"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{item.ownerName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{item.ownerRole}</p>
                          </div>
                          <span className="text-center font-bold">{item.draftCount}</span>
                          <span className="text-center font-bold">{item.questionCount}</span>
                          <span>{item.projectRef}</span>
                          <span>{formatDateTime(item.latestUpdate)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto border-t border-slate-200 pt-4 pr-1">
                {isLoadingDrafts ? (
                  <p className="text-sm text-slate-500">Memuat draf...</p>
                ) : savedDrafts.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada draf tersimpan.</p>
                ) : (
                  savedDrafts.map((draft) => (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => loadDraft(draft)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-200 hover:bg-blue-50"
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {draft.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ID {draft.id} - {draft.questions.length} soalan - {draft.status}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {draft.ownerName || draft.ownerRef} - {draft.ownerRole} - {draft.projectRef}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm hover:bg-blue-100">
              <p className="text-lg font-bold text-blue-700">Seterusnya</p>
              <p className="mt-1 text-sm text-blue-600">Semak Skema & Rubrik</p>
            </button>
          </aside>
        </section>

        {isFeedbackOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                      Feedback Question Bank
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      Maklum Balas Pembangunan Soalan
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Feedback ini direkod bersama akaun login anda untuk membantu penambahbaikan fungsi jana soalan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(false)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
                {feedbackQuestions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-bold leading-6 text-slate-900">
                      {index + 1}. {question.label}
                    </p>

                    {question.type === "text" ? (
                      <textarea
                        value={feedbackResponses[question.id] || ""}
                        onChange={(event) =>
                          updateFeedbackResponse(question.id, event.target.value)
                        }
                        className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                      />
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.options?.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => updateFeedbackResponse(question.id, option)}
                            className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                              feedbackResponses[question.id] === option
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitFeedback}
                  disabled={isSubmittingFeedback}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingFeedback ? "Menghantar..." : "Hantar Feedback"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
