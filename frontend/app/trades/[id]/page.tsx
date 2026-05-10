"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";

type Trade = {
  id: number;
  code: string;
  title: string;
  description?: string;
  sector?: string;
  category_code?: string;
  category_name?: string;
  field_title?: string;
  facilitator_name?: string;
  custom_category?: string;
  custom_field_title?: string;
  status: string;
  workflow_status: string;
};

type CMCSItem = {
  id: number;
  code?: string;
  title: string;
  description?: string;
};

type CompetencyUnit = {
  id: number;
  cmcs_id: number;
  code?: string;
  title: string;
};

type Mapping = {
  id: number;
  trade_id: number;
  cmcs_id: number;
  competency_unit_id?: number | null;
  mapping_notes?: string;
  trade_specific_content?: string;
  draft_module_title?: string;
  draft_objective?: string;
  draft_content_outline?: string;
  suggested_learning_packages?: string;
  suggested_assessment_areas?: string;
  relevance_level: string;
  cmcs_title?: string;
  competency_unit_code?: string;
  competency_unit_title?: string;
};

type MappingAIDraft = {
  trade_specific_content: string;
  draft_module_title: string;
  draft_objective: string;
  draft_content_outline: string;
  suggested_learning_packages: string;
  suggested_assessment_areas: string;
  mapping_notes: string;
};

type TradeCompetency = {
  id: number;
  trade_id: number;
  mapping_id?: number | null;
  code?: string;
  title: string;
  description?: string;
  source_notes?: string;
  status: string;
};

type SKPModule = {
  id: number;
  trade_id: number;
  competency_id?: number | null;
  code: string;
  title: string;
  objective?: string;
  description?: string;
  status: string;
};

type LearningPackage = {
  id: number;
  module_id: number;
  code: string;
  title: string;
  objective?: string;
  description?: string;
  content_outline?: string;
  references?: string;
  exercises?: string;
  answer_scheme?: string;
  status: string;
};

type AssessmentQuestion = {
  id: number;
  package_id: number;
  question_type: string;
  question_text: string;
  answer_scheme?: string;
  rubric?: string;
  marks: number;
  status: string;
};

type WorkflowAssignment = {
  id: number;
  trade_id: number;
  workflow_stage: string;
  role: string;
  assignee_name: string;
  assignee_email?: string;
  task_title: string;
  notes?: string;
  due_date?: string;
  status: string;
};

type ReviewRecord = {
  id: number;
  trade_id: number;
  workflow_stage: string;
  target_type: string;
  target_id?: number | null;
  reviewer_name: string;
  decision: string;
  comments?: string;
  status: string;
};

const WORKFLOW_STATUSES = [
  "Mapping Process",
  "Mapping Review",
  "Module Development",
  "Module Review",
  "Question Development",
  "Question Review",
  "JTPK Presentation",
  "JPL Presentation",
  "Completed",
];
const ASSIGNMENT_ROLES = [
  "super_admin",
  "admin",
  "fasilitator",
  "panel",
  "reviewer",
];
const ASSIGNMENT_STATUSES = ["Assigned", "In Progress", "Review", "Completed"];
const REVIEW_TARGET_TYPES = [
  "Mapping",
  "Competency",
  "Module",
  "Learning Package",
  "Assessment",
  "Presentation",
];
const REVIEW_DECISIONS = ["Approved", "Revise", "Rejected"];
const REVIEW_STATUSES = ["Open", "Closed"];

function FieldHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

export default function TradeDetailPage() {
  const params = useParams();
  const tradeId = params.id as string;
  const [trade, setTrade] = useState<Trade | null>(null);
  const [cmcsItems, setCmcsItems] = useState<CMCSItem[]>([]);
  const [units, setUnits] = useState<CompetencyUnit[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [competencies, setCompetencies] = useState<TradeCompetency[]>([]);
  const [modules, setModules] = useState<SKPModule[]>([]);
  const [learningPackages, setLearningPackages] = useState<
    Record<number, LearningPackage[]>
  >({});
  const [assessmentQuestions, setAssessmentQuestions] = useState<
    Record<number, AssessmentQuestion[]>
  >({});
  const [assignments, setAssignments] = useState<WorkflowAssignment[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCmcsId, setSelectedCmcsId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [relevanceLevel, setRelevanceLevel] = useState("Medium");
  const [mappingNotes, setMappingNotes] = useState("");
  const [tradeSpecificContent, setTradeSpecificContent] = useState("");
  const [draftModuleTitle, setDraftModuleTitle] = useState("");
  const [draftObjective, setDraftObjective] = useState("");
  const [draftContentOutline, setDraftContentOutline] = useState("");
  const [suggestedLearningPackages, setSuggestedLearningPackages] = useState("");
  const [suggestedAssessmentAreas, setSuggestedAssessmentAreas] = useState("");
  const [savingMapping, setSavingMapping] = useState(false);
  const [generatingAIDraft, setGeneratingAIDraft] = useState(false);
  const [mappingError, setMappingError] = useState("");
  const [editingMappingId, setEditingMappingId] = useState<number | null>(null);
  const [generatingMappingId, setGeneratingMappingId] = useState<number | null>(
    null,
  );
  const [editingCompetencyId, setEditingCompetencyId] = useState<number | null>(
    null,
  );
  const [sourceMappingId, setSourceMappingId] = useState<number | null>(null);
  const [competencyCode, setCompetencyCode] = useState("");
  const [competencyTitle, setCompetencyTitle] = useState("");
  const [competencyDescription, setCompetencyDescription] = useState("");
  const [competencyStatus, setCompetencyStatus] = useState("Draft");
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [sourceCompetencyId, setSourceCompetencyId] = useState<number | null>(null);
  const [moduleCode, setModuleCode] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleObjective, setModuleObjective] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleStatus, setModuleStatus] = useState("Draft");
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [packageCode, setPackageCode] = useState("");
  const [packageTitle, setPackageTitle] = useState("");
  const [packageObjective, setPackageObjective] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [packageOutline, setPackageOutline] = useState("");
  const [packageStatus, setPackageStatus] = useState("Draft");
  const [activePackageId, setActivePackageId] = useState<number | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState("Subjective");
  const [questionText, setQuestionText] = useState("");
  const [answerScheme, setAnswerScheme] = useState("");
  const [rubric, setRubric] = useState("");
  const [marks, setMarks] = useState(1);
  const [questionStatus, setQuestionStatus] = useState("Draft");
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(
    null,
  );
  const [assignmentStage, setAssignmentStage] = useState("Mapping Process");
  const [assignmentRole, setAssignmentRole] = useState("panel");
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [assignmentTaskTitle, setAssignmentTaskTitle] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("Assigned");
  const [assignmentError, setAssignmentError] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewStage, setReviewStage] = useState("Mapping Review");
  const [reviewTargetType, setReviewTargetType] = useState("Mapping");
  const [reviewTargetId, setReviewTargetId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewDecision, setReviewDecision] = useState("Revise");
  const [reviewComments, setReviewComments] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Open");
  const [reviewError, setReviewError] = useState("");
  const [activeWorkflow, setActiveWorkflow] = useState<
    | "overview"
    | "assignments"
    | "reviews"
    | "mapping"
    | "competency"
    | "modules"
    | "learning"
    | "assessment"
    | "preview"
  >("overview");

  const selectedCmcs = cmcsItems.find(
    (item) => item.id === Number(selectedCmcsId),
  );
  const selectedUnit = units.find((unit) => unit.id === Number(selectedUnitId));
  const highRelevanceCount = mappings.filter(
    (mapping) => mapping.relevance_level === "High",
  ).length;
  const currentWorkflowStatus = trade?.workflow_status || "Mapping Process";
  const currentWorkflowIndex = Math.max(
    WORKFLOW_STATUSES.indexOf(currentWorkflowStatus),
    0,
  );
  const packageCount = Object.values(learningPackages).reduce(
    (total, packages) => total + packages.length,
    0,
  );
  const questionCount = Object.values(assessmentQuestions).reduce(
    (total, questions) => total + questions.length,
    0,
  );
  const mappingsWithoutInterpretation = mappings.filter(
    (mapping) => !mapping.trade_specific_content?.trim(),
  );
  const mappingsWithoutDraftContent = mappings.filter(
    (mapping) =>
      !mapping.draft_module_title?.trim() &&
      !mapping.draft_content_outline?.trim(),
  );
  const modulesWithoutSource = modules.filter(
    (skpModule) =>
      !skpModule.competency_id ||
      !competencies.some((competency) => competency.id === skpModule.competency_id),
  );
  const packagesWithoutOutline = Object.values(learningPackages)
    .flat()
    .filter((packageItem) => !packageItem.content_outline?.trim());
  const packagesWithoutAssessment = Object.values(learningPackages)
    .flat()
    .filter(
      (packageItem) => (assessmentQuestions[packageItem.id] || []).length === 0,
    );
  const healthIssues = [
    ...mappingsWithoutInterpretation.map((mapping) => ({
      label: "Mapping tanpa trade interpretation",
      detail: mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`,
    })),
    ...mappingsWithoutDraftContent.map((mapping) => ({
      label: "Mapping tanpa draft module content",
      detail: mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`,
    })),
    ...modulesWithoutSource.map((skpModule) => ({
      label: "Module tanpa source competency",
      detail: `${skpModule.code} - ${skpModule.title}`,
    })),
    ...packagesWithoutOutline.map((packageItem) => ({
      label: "PL tanpa content outline",
      detail: `${packageItem.code} - ${packageItem.title}`,
    })),
    ...packagesWithoutAssessment.map((packageItem) => ({
      label: "PL tanpa assessment",
      detail: `${packageItem.code} - ${packageItem.title}`,
    })),
  ];
  const workflowTabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "assignments", label: "Assignments", count: assignments.length },
    { id: "reviews", label: "Reviews", count: reviews.length },
    { id: "mapping", label: "Mapping", count: mappings.length },
    { id: "competency", label: "Competency", count: competencies.length },
    { id: "modules", label: "Modules", count: modules.length },
    { id: "learning", label: "Learning Packages", count: packageCount },
    { id: "assessment", label: "Assessment", count: questionCount },
    { id: "preview", label: "Preview", count: null },
  ] as const;

  function getCmcsLabel(item: CMCSItem) {
    return item.code || `CMCS-${String(item.id).padStart(3, "0")}`;
  }

  function clearMappingDraft() {
    setTradeSpecificContent("");
    setDraftModuleTitle("");
    setDraftObjective("");
    setDraftContentOutline("");
    setSuggestedLearningPackages("");
    setSuggestedAssessmentAreas("");
    setMappingNotes("");
    setMappingError("");
  }

  function applyAIDraft(draft: MappingAIDraft) {
    setTradeSpecificContent(draft.trade_specific_content || "");
    setDraftModuleTitle(draft.draft_module_title || "");
    setDraftObjective(draft.draft_objective || "");
    setDraftContentOutline(draft.draft_content_outline || "");
    setSuggestedLearningPackages(draft.suggested_learning_packages || "");
    setSuggestedAssessmentAreas(draft.suggested_assessment_areas || "");
    setMappingNotes(draft.mapping_notes || "");
  }

  function firstMeaningfulLine(value?: string) {
    return (
      value
        ?.split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) || ""
    );
  }

  function parseDraftLines(value?: string) {
    return (
      value
        ?.split(/\r?\n/)
        .map((line) =>
          line
            .trim()
            .replace(/^[-*]\s*/, "")
            .replace(/^\d+[.)]\s*/, ""),
        )
        .filter(Boolean) || []
    );
  }

  function parsePackageSuggestion(line: string, index: number) {
    const match = line.match(/^(PL\d+)\s*[-:]\s*(.+)$/i);

    if (match) {
      return {
        code: match[1].toUpperCase(),
        title: match[2].trim(),
      };
    }

    return {
      code: `PL${String(index + 1).padStart(2, "0")}`,
      title: line,
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function loadTrade() {
      try {
        const [
          tradeResponse,
          cmcsResponse,
          mappingResponse,
          competencyResponse,
          moduleResponse,
          assignmentResponse,
          reviewResponse,
        ] = await Promise.all([
            axios.get(`${API_BASE_URL}/trades/${tradeId}`),
            axios.get(`${API_BASE_URL}/cmcs/`),
            axios.get(`${API_BASE_URL}/trade-cmcs-mappings/trade/${tradeId}`),
            axios.get(`${API_BASE_URL}/trade-competencies/trade/${tradeId}`),
            axios.get(`${API_BASE_URL}/skp-modules/trade/${tradeId}`),
            axios.get(`${API_BASE_URL}/workflow-assignments/trade/${tradeId}`),
            axios.get(`${API_BASE_URL}/review-records/trade/${tradeId}`),
          ]);

        if (!cancelled) {
          setTrade(tradeResponse.data);
          setCmcsItems(cmcsResponse.data);
          setMappings(mappingResponse.data);
          setCompetencies(competencyResponse.data);
          setModules(moduleResponse.data);
          setAssignments(assignmentResponse.data);
          setReviews(reviewResponse.data);

          const packageMap: Record<number, LearningPackage[]> = {};
          const questionMap: Record<number, AssessmentQuestion[]> = {};

          for (const skpModule of moduleResponse.data) {
            const packageResponse = await axios.get(
              `${API_BASE_URL}/learning-packages/module/${skpModule.id}`,
            );
            packageMap[skpModule.id] = packageResponse.data;

            for (const packageItem of packageResponse.data) {
              const questionResponse = await axios.get(
                `${API_BASE_URL}/assessment-questions/package/${packageItem.id}`,
              );
              questionMap[packageItem.id] = questionResponse.data;
            }
          }

          setLearningPackages(packageMap);
          setAssessmentQuestions(questionMap);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrade();

    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadUnits() {
      if (!selectedCmcsId) {
        setUnits([]);
        setSelectedUnitId("");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/competency-units/cmcs/${selectedCmcsId}`,
      );

      if (!cancelled) {
        setUnits(response.data);
        if (!editingMappingId) {
          setSelectedUnitId("");
        }
      }
    }

    loadUnits();

    return () => {
      cancelled = true;
    };
  }, [editingMappingId, selectedCmcsId]);

  async function refreshMappings() {
    const response = await axios.get(
      `${API_BASE_URL}/trade-cmcs-mappings/trade/${tradeId}`,
    );
    setMappings(response.data);
  }

  async function refreshCompetencies() {
    const response = await axios.get(
      `${API_BASE_URL}/trade-competencies/trade/${tradeId}`,
    );
    setCompetencies(response.data);
  }

  async function refreshModules() {
    const response = await axios.get(`${API_BASE_URL}/skp-modules/trade/${tradeId}`);
    setModules(response.data);

    const packageMap: Record<number, LearningPackage[]> = {};
    const questionMap: Record<number, AssessmentQuestion[]> = {};

    for (const skpModule of response.data) {
      const packageResponse = await axios.get(
        `${API_BASE_URL}/learning-packages/module/${skpModule.id}`,
      );
      packageMap[skpModule.id] = packageResponse.data;

      for (const packageItem of packageResponse.data) {
        const questionResponse = await axios.get(
          `${API_BASE_URL}/assessment-questions/package/${packageItem.id}`,
        );
        questionMap[packageItem.id] = questionResponse.data;
      }
    }

    setLearningPackages(packageMap);
    setAssessmentQuestions(questionMap);
  }

  async function refreshPackages(moduleId: number) {
    const response = await axios.get(
      `${API_BASE_URL}/learning-packages/module/${moduleId}`,
    );
    setLearningPackages((current) => ({
      ...current,
      [moduleId]: response.data,
    }));
  }

  async function refreshQuestions(packageId: number) {
    const response = await axios.get(
      `${API_BASE_URL}/assessment-questions/package/${packageId}`,
    );
    setAssessmentQuestions((current) => ({
      ...current,
      [packageId]: response.data,
    }));
  }

  async function refreshAssignments() {
    const response = await axios.get(
      `${API_BASE_URL}/workflow-assignments/trade/${tradeId}`,
    );
    setAssignments(response.data);
  }

  async function refreshReviews() {
    const response = await axios.get(
      `${API_BASE_URL}/review-records/trade/${tradeId}`,
    );
    setReviews(response.data);
  }

  async function updateWorkflowStatus(workflowStatus: string) {
    if (!trade) return;

    const response = await axios.put(`${API_BASE_URL}/trades/${trade.id}`, {
      workflow_status: workflowStatus,
    });
    setTrade(response.data);
  }

  function resetAssignmentForm() {
    setEditingAssignmentId(null);
    setAssignmentStage(currentWorkflowStatus);
    setAssignmentRole("panel");
    setAssigneeName("");
    setAssigneeEmail("");
    setAssignmentTaskTitle("");
    setAssignmentNotes("");
    setAssignmentDueDate("");
    setAssignmentStatus("Assigned");
    setAssignmentError("");
  }

  function handleEditAssignment(assignment: WorkflowAssignment) {
    setEditingAssignmentId(assignment.id);
    setAssignmentStage(assignment.workflow_stage);
    setAssignmentRole(assignment.role);
    setAssigneeName(assignment.assignee_name);
    setAssigneeEmail(assignment.assignee_email || "");
    setAssignmentTaskTitle(assignment.task_title);
    setAssignmentNotes(assignment.notes || "");
    setAssignmentDueDate(assignment.due_date || "");
    setAssignmentStatus(assignment.status);
    setAssignmentError("");
    setActiveWorkflow("assignments");
  }

  async function handleSaveAssignment(e: React.FormEvent) {
    e.preventDefault();

    if (!assigneeName.trim() || !assignmentTaskTitle.trim()) {
      setAssignmentError("Nama penerima tugasan dan tajuk tugasan diperlukan.");
      return;
    }

    const payload = {
      trade_id: Number(tradeId),
      workflow_stage: assignmentStage,
      role: assignmentRole,
      assignee_name: assigneeName.trim(),
      assignee_email: assigneeEmail.trim() || null,
      task_title: assignmentTaskTitle.trim(),
      notes: assignmentNotes,
      due_date: assignmentDueDate || null,
      status: assignmentStatus,
    };

    if (editingAssignmentId) {
      await axios.put(
        `${API_BASE_URL}/workflow-assignments/${editingAssignmentId}`,
        payload,
      );
    } else {
      await axios.post(`${API_BASE_URL}/workflow-assignments/`, payload);
    }

    await refreshAssignments();
    resetAssignmentForm();
  }

  async function deleteAssignment(id: number) {
    if (!window.confirm("Padam assignment ini?")) return;

    await axios.delete(`${API_BASE_URL}/workflow-assignments/${id}`);
    await refreshAssignments();
  }

  function resetReviewForm() {
    setEditingReviewId(null);
    setReviewStage("Mapping Review");
    setReviewTargetType("Mapping");
    setReviewTargetId("");
    setReviewerName("");
    setReviewDecision("Revise");
    setReviewComments("");
    setReviewStatus("Open");
    setReviewError("");
  }

  function handleEditReview(review: ReviewRecord) {
    setEditingReviewId(review.id);
    setReviewStage(review.workflow_stage);
    setReviewTargetType(review.target_type);
    setReviewTargetId(review.target_id ? String(review.target_id) : "");
    setReviewerName(review.reviewer_name);
    setReviewDecision(review.decision);
    setReviewComments(review.comments || "");
    setReviewStatus(review.status);
    setReviewError("");
    setActiveWorkflow("reviews");
  }

  async function handleSaveReview(e: React.FormEvent) {
    e.preventDefault();

    if (!reviewerName.trim() || !reviewComments.trim()) {
      setReviewError("Nama reviewer dan komen semakan diperlukan.");
      return;
    }

    const payload = {
      trade_id: Number(tradeId),
      workflow_stage: reviewStage,
      target_type: reviewTargetType,
      target_id: reviewTargetId ? Number(reviewTargetId) : null,
      reviewer_name: reviewerName.trim(),
      decision: reviewDecision,
      comments: reviewComments,
      status: reviewStatus,
    };

    if (editingReviewId) {
      await axios.put(`${API_BASE_URL}/review-records/${editingReviewId}`, payload);
    } else {
      await axios.post(`${API_BASE_URL}/review-records/`, payload);
    }

    await refreshReviews();
    resetReviewForm();
  }

  async function deleteReview(id: number) {
    if (!window.confirm("Padam review record ini?")) return;

    await axios.delete(`${API_BASE_URL}/review-records/${id}`);
    await refreshReviews();
  }

  async function handleAddMapping(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCmcsId) {
      setMappingError("Pilih CMCS dahulu.");
      return;
    }

    setSavingMapping(true);
    setMappingError("");

    try {
      const payload = {
        trade_id: Number(tradeId),
        cmcs_id: Number(selectedCmcsId),
        competency_unit_id: selectedUnitId ? Number(selectedUnitId) : null,
        relevance_level: relevanceLevel,
        mapping_notes: mappingNotes,
        trade_specific_content: tradeSpecificContent,
        draft_module_title: draftModuleTitle,
        draft_objective: draftObjective,
        draft_content_outline: draftContentOutline,
        suggested_learning_packages: suggestedLearningPackages,
        suggested_assessment_areas: suggestedAssessmentAreas,
      };

      if (editingMappingId) {
        await axios.put(
          `${API_BASE_URL}/trade-cmcs-mappings/${editingMappingId}`,
          {
            competency_unit_id: payload.competency_unit_id,
            relevance_level: payload.relevance_level,
            mapping_notes: payload.mapping_notes,
            trade_specific_content: payload.trade_specific_content,
            draft_module_title: payload.draft_module_title,
            draft_objective: payload.draft_objective,
            draft_content_outline: payload.draft_content_outline,
            suggested_learning_packages: payload.suggested_learning_packages,
            suggested_assessment_areas: payload.suggested_assessment_areas,
          },
        );
      } else {
        await axios.post(`${API_BASE_URL}/trade-cmcs-mappings/`, payload);
      }

      setSelectedCmcsId("");
      setSelectedUnitId("");
      setRelevanceLevel("Medium");
      clearMappingDraft();
      setEditingMappingId(null);
      await refreshMappings();
    } catch (err) {
      setMappingError("Mapping gagal disimpan atau sudah wujud.");
      console.error(err);
    } finally {
      setSavingMapping(false);
    }
  }

  async function handleGenerateAIDraft() {
    if (!selectedCmcsId) {
      setMappingError("Pilih CMCS dahulu.");
      return;
    }

    setGeneratingAIDraft(true);
    setMappingError("");

    try {
      const response = await axios.post<MappingAIDraft>(
        `${API_BASE_URL}/trade-cmcs-mappings/ai-draft`,
        {
          trade_id: Number(tradeId),
          cmcs_id: Number(selectedCmcsId),
          competency_unit_id: selectedUnitId ? Number(selectedUnitId) : null,
        },
      );

      applyAIDraft(response.data);
    } catch (err) {
      setMappingError(
        "Jana AI gagal. Semak OPENAI_API_KEY di Render atau cuba semula.",
      );
      console.error(err);
    } finally {
      setGeneratingAIDraft(false);
    }
  }

  async function handleEditMapping(mapping: Mapping) {
    setEditingMappingId(mapping.id);
    setSelectedCmcsId(String(mapping.cmcs_id));
    setSelectedUnitId(mapping.competency_unit_id ? String(mapping.competency_unit_id) : "");
    setRelevanceLevel(mapping.relevance_level);
    setMappingNotes(mapping.mapping_notes || "");
    setTradeSpecificContent(mapping.trade_specific_content || "");
    setDraftModuleTitle(mapping.draft_module_title || "");
    setDraftObjective(mapping.draft_objective || "");
    setDraftContentOutline(mapping.draft_content_outline || "");
    setSuggestedLearningPackages(mapping.suggested_learning_packages || "");
    setSuggestedAssessmentAreas(mapping.suggested_assessment_areas || "");

    if (mapping.cmcs_id) {
      const response = await axios.get(
        `${API_BASE_URL}/competency-units/cmcs/${mapping.cmcs_id}`,
      );
      setUnits(response.data);
    }
  }

  function resetMappingForm() {
    setEditingMappingId(null);
    setSelectedCmcsId("");
    setSelectedUnitId("");
    setRelevanceLevel("Medium");
    clearMappingDraft();
  }

  async function handleDeleteMapping(id: number) {
    if (!window.confirm("Padam mapping ini?")) return;

    await axios.delete(`${API_BASE_URL}/trade-cmcs-mappings/${id}`);
    await refreshMappings();
  }

  function draftCompetencyFromMapping(mapping: Mapping) {
    setActiveWorkflow("competency");
    setEditingCompetencyId(null);
    setSourceMappingId(mapping.id);
    setCompetencyCode(`TC-${String(competencies.length + 1).padStart(2, "0")}`);
    setCompetencyTitle(
      mapping.draft_module_title ||
        firstMeaningfulLine(mapping.trade_specific_content) ||
        mapping.cmcs_title ||
        "",
    );
    setCompetencyDescription(
      [
        mapping.trade_specific_content,
        mapping.draft_objective,
        mapping.draft_content_outline,
        mapping.suggested_learning_packages,
        mapping.suggested_assessment_areas,
        mapping.mapping_notes,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
    setCompetencyStatus("Draft");
  }

  function draftModuleFromMapping(mapping: Mapping) {
    setActiveWorkflow("modules");
    setEditingModuleId(null);
    setSourceCompetencyId(null);
    setModuleCode(`M${String(modules.length + 1).padStart(2, "0")}`);
    setModuleTitle(
      mapping.draft_module_title ||
        firstMeaningfulLine(mapping.trade_specific_content) ||
        mapping.cmcs_title ||
        "",
    );
    setModuleObjective(mapping.draft_objective || "");
    setModuleDescription(
      [
        mapping.trade_specific_content,
        mapping.draft_content_outline,
        mapping.suggested_learning_packages
          ? `Suggested Learning Packages:\n${mapping.suggested_learning_packages}`
          : "",
        mapping.suggested_assessment_areas
          ? `Suggested Assessment Areas:\n${mapping.suggested_assessment_areas}`
          : "",
        mapping.mapping_notes ? `Mapping Notes:\n${mapping.mapping_notes}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
    setModuleStatus("Draft");
  }

  async function generateModulePackageAssessmentFromMapping(mapping: Mapping) {
    const generatedModuleTitle =
      mapping.draft_module_title ||
      firstMeaningfulLine(mapping.trade_specific_content) ||
      mapping.cmcs_title ||
      "";

    if (!generatedModuleTitle.trim()) {
      setMappingError("Mapping ini belum ada tajuk modul untuk dijana.");
      return;
    }

    setGeneratingMappingId(mapping.id);
    setMappingError("");

    try {
      const moduleResponse = await axios.post(`${API_BASE_URL}/skp-modules/`, {
        trade_id: Number(tradeId),
        competency_id: null,
        code: `M${String(modules.length + 1).padStart(2, "0")}`,
        title: generatedModuleTitle,
        objective: mapping.draft_objective || "",
        description: [
          mapping.trade_specific_content,
          mapping.draft_content_outline,
          mapping.mapping_notes ? `Mapping Notes:\n${mapping.mapping_notes}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        status: "Draft",
      });

      const generatedModule: SKPModule = moduleResponse.data;
      const packageSuggestions = parseDraftLines(
        mapping.suggested_learning_packages,
      );
      const packageDrafts =
        packageSuggestions.length > 0
          ? packageSuggestions.map(parsePackageSuggestion)
          : [
              {
                code: "PL01",
                title: generatedModuleTitle,
              },
            ];

      const createdPackages: LearningPackage[] = [];

      for (const [index, packageDraft] of packageDrafts.entries()) {
        const packageResponse = await axios.post(
          `${API_BASE_URL}/learning-packages/`,
          {
            module_id: generatedModule.id,
            code: packageDraft.code,
            title: packageDraft.title,
            objective: mapping.draft_objective || "",
            description: mapping.trade_specific_content || "",
            content_outline:
              mapping.draft_content_outline ||
              `${index + 1}. ${packageDraft.title}`,
            references: "",
            exercises: "",
            answer_scheme: "",
            status: "Draft",
          },
        );

        createdPackages.push(packageResponse.data);
      }

      const assessmentSuggestions = parseDraftLines(
        mapping.suggested_assessment_areas,
      );

      for (const [index, assessment] of assessmentSuggestions.entries()) {
        const targetPackage =
          createdPackages[index % createdPackages.length] || createdPackages[0];

        if (!targetPackage) continue;

        await axios.post(`${API_BASE_URL}/assessment-questions/`, {
          package_id: targetPackage.id,
          question_type: "Practical Task",
          question_text: assessment,
          answer_scheme: "",
          rubric: "",
          marks: 1,
          status: "Draft",
        });
      }

      await refreshModules();
      setActiveModuleId(generatedModule.id);
      setActiveWorkflow("modules");
    } catch (err) {
      setMappingError("Generate Module + PL gagal. Semak backend server.");
      console.error(err);
    } finally {
      setGeneratingMappingId(null);
    }
  }

  function editCompetency(competency: TradeCompetency) {
    setEditingCompetencyId(competency.id);
    setSourceMappingId(competency.mapping_id || null);
    setCompetencyCode(competency.code || "");
    setCompetencyTitle(competency.title);
    setCompetencyDescription(competency.description || "");
    setCompetencyStatus(competency.status);
  }

  function resetCompetencyForm() {
    setEditingCompetencyId(null);
    setCompetencyCode("");
    setCompetencyTitle("");
    setCompetencyDescription("");
    setCompetencyStatus("Draft");
    setSourceMappingId(null);
  }

  async function handleSaveCompetency(e: React.FormEvent) {
    e.preventDefault();

    if (!competencyTitle.trim()) return;

    const payload = {
      trade_id: Number(tradeId),
      mapping_id: sourceMappingId,
      code: competencyCode,
      title: competencyTitle,
      description: competencyDescription,
      source_notes: sourceMappingId ? `Generated from mapping ${sourceMappingId}` : "",
      status: competencyStatus,
    };

    if (editingCompetencyId) {
      await axios.put(`${API_BASE_URL}/trade-competencies/${editingCompetencyId}`, {
        code: payload.code,
        title: payload.title,
        description: payload.description,
        status: payload.status,
      });
    } else {
      await axios.post(`${API_BASE_URL}/trade-competencies/`, payload);
    }

    resetCompetencyForm();
    await refreshCompetencies();
  }

  async function deleteCompetency(id: number) {
    if (!window.confirm("Padam trade competency ini?")) return;

    await axios.delete(`${API_BASE_URL}/trade-competencies/${id}`);
    await refreshCompetencies();
  }

  function draftModuleFromCompetency(competency: TradeCompetency) {
    setActiveWorkflow("modules");
    setEditingModuleId(null);
    setSourceCompetencyId(competency.id);
    setModuleCode(`M${String(modules.length + 1).padStart(2, "0")}`);
    setModuleTitle(competency.title);
    setModuleObjective(competency.description || "");
    setModuleDescription("");
    setModuleStatus("Draft");
  }

  function editModule(skpModule: SKPModule) {
    setEditingModuleId(skpModule.id);
    setSourceCompetencyId(skpModule.competency_id || null);
    setModuleCode(skpModule.code);
    setModuleTitle(skpModule.title);
    setModuleObjective(skpModule.objective || "");
    setModuleDescription(skpModule.description || "");
    setModuleStatus(skpModule.status);
  }

  function resetModuleForm() {
    setEditingModuleId(null);
    setSourceCompetencyId(null);
    setModuleCode("");
    setModuleTitle("");
    setModuleObjective("");
    setModuleDescription("");
    setModuleStatus("Draft");
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();

    if (!moduleCode.trim() || !moduleTitle.trim()) return;

    const payload = {
      trade_id: Number(tradeId),
      competency_id: sourceCompetencyId,
      code: moduleCode,
      title: moduleTitle,
      objective: moduleObjective,
      description: moduleDescription,
      status: moduleStatus,
    };

    if (editingModuleId) {
      await axios.put(`${API_BASE_URL}/skp-modules/${editingModuleId}`, {
        competency_id: payload.competency_id,
        code: payload.code,
        title: payload.title,
        objective: payload.objective,
        description: payload.description,
        status: payload.status,
      });
    } else {
      await axios.post(`${API_BASE_URL}/skp-modules/`, payload);
    }

    resetModuleForm();
    await refreshModules();
  }

  async function deleteModule(id: number) {
    if (!window.confirm("Padam modul SKP ini?")) return;

    await axios.delete(`${API_BASE_URL}/skp-modules/${id}`);
    await refreshModules();
  }

  function draftPackageFromModule(skpModule: SKPModule) {
    setActiveWorkflow("learning");
    const currentPackages = learningPackages[skpModule.id] || [];
    setActiveModuleId(skpModule.id);
    setEditingPackageId(null);
    setPackageCode(`PL${String(currentPackages.length + 1).padStart(2, "0")}`);
    setPackageTitle(skpModule.title);
    setPackageObjective(skpModule.objective || "");
    setPackageDescription(skpModule.description || "");
    setPackageOutline("");
    setPackageStatus("Draft");
  }

  function editPackage(packageItem: LearningPackage) {
    setActiveModuleId(packageItem.module_id);
    setEditingPackageId(packageItem.id);
    setPackageCode(packageItem.code);
    setPackageTitle(packageItem.title);
    setPackageObjective(packageItem.objective || "");
    setPackageDescription(packageItem.description || "");
    setPackageOutline(packageItem.content_outline || "");
    setPackageStatus(packageItem.status);
  }

  function resetPackageForm() {
    setActiveModuleId(null);
    setEditingPackageId(null);
    setPackageCode("");
    setPackageTitle("");
    setPackageObjective("");
    setPackageDescription("");
    setPackageOutline("");
    setPackageStatus("Draft");
  }

  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();

    if (!activeModuleId || !packageCode.trim() || !packageTitle.trim()) return;

    const payload = {
      module_id: activeModuleId,
      code: packageCode,
      title: packageTitle,
      objective: packageObjective,
      description: packageDescription,
      content_outline: packageOutline,
      references: "",
      exercises: "",
      answer_scheme: "",
      status: packageStatus,
    };

    if (editingPackageId) {
      await axios.put(`${API_BASE_URL}/learning-packages/${editingPackageId}`, {
        code: payload.code,
        title: payload.title,
        objective: payload.objective,
        description: payload.description,
        content_outline: payload.content_outline,
        status: payload.status,
      });
    } else {
      await axios.post(`${API_BASE_URL}/learning-packages/`, payload);
    }

    const savedModuleId = activeModuleId;
    await refreshPackages(savedModuleId);
    setEditingPackageId(null);
    setPackageCode("");
    setPackageTitle("");
    setPackageObjective("");
    setPackageDescription("");
    setPackageOutline("");
    setPackageStatus("Draft");
    setActiveModuleId(savedModuleId);
  }

  async function deletePackage(packageItem: LearningPackage) {
    if (!window.confirm("Padam learning package ini?")) return;

    await axios.delete(`${API_BASE_URL}/learning-packages/${packageItem.id}`);
    await refreshPackages(packageItem.module_id);
  }

  function draftQuestionFromPackage(packageItem: LearningPackage) {
    setActiveWorkflow("assessment");
    setActivePackageId(packageItem.id);
    setEditingQuestionId(null);
    setQuestionType("Subjective");
    setQuestionText("");
    setAnswerScheme(packageItem.answer_scheme || "");
    setRubric("");
    setMarks(1);
    setQuestionStatus("Draft");
  }

  function editQuestion(question: AssessmentQuestion) {
    setActivePackageId(question.package_id);
    setEditingQuestionId(question.id);
    setQuestionType(question.question_type);
    setQuestionText(question.question_text);
    setAnswerScheme(question.answer_scheme || "");
    setRubric(question.rubric || "");
    setMarks(question.marks);
    setQuestionStatus(question.status);
  }

  function resetQuestionForm() {
    setActivePackageId(null);
    setEditingQuestionId(null);
    setQuestionType("Subjective");
    setQuestionText("");
    setAnswerScheme("");
    setRubric("");
    setMarks(1);
    setQuestionStatus("Draft");
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();

    if (!activePackageId || !questionText.trim()) return;

    const payload = {
      package_id: activePackageId,
      question_type: questionType,
      question_text: questionText,
      answer_scheme: answerScheme,
      rubric,
      marks,
      status: questionStatus,
    };

    if (editingQuestionId) {
      await axios.put(`${API_BASE_URL}/assessment-questions/${editingQuestionId}`, {
        question_type: payload.question_type,
        question_text: payload.question_text,
        answer_scheme: payload.answer_scheme,
        rubric: payload.rubric,
        marks: payload.marks,
        status: payload.status,
      });
    } else {
      await axios.post(`${API_BASE_URL}/assessment-questions/`, payload);
    }

    await refreshQuestions(activePackageId);
    resetQuestionForm();
  }

  async function deleteQuestion(question: AssessmentQuestion) {
    if (!window.confirm("Padam soalan assessment ini?")) return;

    await axios.delete(`${API_BASE_URL}/assessment-questions/${question.id}`);
    await refreshQuestions(question.package_id);
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading...</p>
      </AppShell>
    );
  }

  if (!trade) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-700">Tred tidak dijumpai</h1>
          <Link
            href="/trades"
            className="mt-4 inline-block text-sm font-semibold text-blue-600"
          >
            Kembali ke senarai tred
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <Link href="/trades" className="text-sm font-semibold text-blue-600">
            Kembali ke Trade/Tred Builder
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
            Trade/Tred Detail
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {trade.code} - {trade.title}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            {trade.description || "Tiada penerangan direkodkan."}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                SKP Project Workflow
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {currentWorkflowStatus}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Status kerja semasa untuk tred ini, dari mapping CMCS sehingga
                selesai pembentangan.
              </p>
            </div>

            <select
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 lg:min-w-[260px]"
              value={currentWorkflowStatus}
              onChange={(e) => updateWorkflowStatus(e.target.value)}
            >
              {WORKFLOW_STATUSES.map((workflow) => (
                <option key={workflow} value={workflow}>
                  {workflow}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-9">
            {WORKFLOW_STATUSES.map((workflow, index) => {
              const isDone = index < currentWorkflowIndex;
              const isCurrent = index === currentWorkflowIndex;

              return (
                <div
                  key={workflow}
                  className={[
                    "rounded-xl border px-3 py-3 text-xs font-semibold",
                    isCurrent
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                  ].join(" ")}
                >
                  <p className="text-[10px] uppercase opacity-75">
                    Step {index + 1}
                  </p>
                  <p className="mt-1">{workflow}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {workflowTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkflow(tab.id)}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  activeWorkflow === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={[
                      "ml-2 rounded-full px-2 py-0.5 text-xs",
                      activeWorkflow === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {activeWorkflow === "overview" && (
          <>
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Kod Bidang</p>
            <p className="mt-2 text-xl font-bold text-blue-600">{trade.code}</p>
            <p className="mt-1 text-sm text-slate-500">
              {trade.field_title || trade.custom_field_title || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Kategori</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {trade.category_name || trade.custom_category || trade.sector || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Fasilitator</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {trade.facilitator_name || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Mapped CMCS</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {mappings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">High Relevance</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {highRelevanceCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Draft Competency</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {competencies.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">SKP Modules</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {modules.length}
            </p>
          </div>
        </section>

        {mappings.length === 0 && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-blue-600">
                  Langkah Seterusnya
                </p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">
                  Mula mapping CMCS untuk {trade.code}
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">
                  Pilih CMCS rujukan, isi tafsiran khusus tred, kemudian simpan
                  mapping secara manual tanpa AI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveWorkflow("mapping")}
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mula Mapping CMCS
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Development Pipeline
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {WORKFLOW_STATUSES.map((item, index) => (
              <div
                key={item}
                className={[
                  "rounded-xl border p-4",
                  index === currentWorkflowIndex
                    ? "border-blue-600 bg-blue-50"
                    : index < currentWorkflowIndex
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50",
                ].join(" ")}
              >
                <p className="text-xs font-bold uppercase text-blue-600">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
          </>
        )}

        {activeWorkflow === "assignments" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Workflow Assignment
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Agihkan tugasan kepada fasilitator, panel atau reviewer
                  mengikut fasa sebenar pembangunan SKP.
                </p>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {assignments.length} assignment
              </span>
            </div>

            <form onSubmit={handleSaveAssignment} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={assignmentStage}
                  onChange={(e) => setAssignmentStage(e.target.value)}
                >
                  {WORKFLOW_STATUSES.map((workflow) => (
                    <option key={workflow} value={workflow}>
                      {workflow}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                >
                  {ASSIGNMENT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Nama panel / fasilitator"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                />

                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Email, jika ada"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Tajuk tugasan, contoh: Bangunkan Modul M01"
                  value={assignmentTaskTitle}
                  onChange={(e) => setAssignmentTaskTitle(e.target.value)}
                />

                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={assignmentDueDate}
                  onChange={(e) => setAssignmentDueDate(e.target.value)}
                />

                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={assignmentStatus}
                  onChange={(e) => setAssignmentStatus(e.target.value)}
                >
                  {ASSIGNMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Nota tugasan, skop kerja, atau arahan ringkas"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />

              {assignmentError && (
                <p className="text-sm font-semibold text-red-600">
                  {assignmentError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingAssignmentId ? "Update Assignment" : "+ Save Assignment"}
                </button>

                {editingAssignmentId && (
                  <button
                    type="button"
                    onClick={resetAssignmentForm}
                    className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {assignments.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500">
                  Belum ada assignment untuk tred ini.
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="grid gap-4 px-5 py-4 xl:grid-cols-[180px_160px_1fr_170px_160px]"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase text-blue-600">
                        {assignment.workflow_stage}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {assignment.role}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {assignment.assignee_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {assignment.assignee_email || "Tiada email"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {assignment.task_title}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-500">
                        {assignment.notes || "Tiada nota"}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      Due: {assignment.due_date || "-"}
                    </div>

                    <div className="flex items-start justify-end gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {assignment.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditAssignment(assignment)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAssignment(assignment.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeWorkflow === "reviews" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Panel Review & Approval
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Rekod keputusan semakan panel untuk mapping, modul, PL,
                  assessment dan pembentangan.
                </p>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {reviews.length} review
              </span>
            </div>

            <form onSubmit={handleSaveReview} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-5">
                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={reviewStage}
                  onChange={(e) => setReviewStage(e.target.value)}
                >
                  {WORKFLOW_STATUSES.map((workflow) => (
                    <option key={workflow} value={workflow}>
                      {workflow}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={reviewTargetType}
                  onChange={(e) => setReviewTargetType(e.target.value)}
                >
                  {REVIEW_TARGET_TYPES.map((targetType) => (
                    <option key={targetType} value={targetType}>
                      {targetType}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Target ID, jika ada"
                  value={reviewTargetId}
                  onChange={(e) => setReviewTargetId(e.target.value)}
                />

                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                >
                  {REVIEW_DECISIONS.map((decision) => (
                    <option key={decision} value={decision}>
                      {decision}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                >
                  {REVIEW_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Nama reviewer / ahli panel"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
              />

              <textarea
                className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Komen semakan, pindaan diminta, atau keputusan kelulusan"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
              />

              {reviewError && (
                <p className="text-sm font-semibold text-red-600">
                  {reviewError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingReviewId ? "Update Review" : "+ Save Review"}
                </button>

                {editingReviewId && (
                  <button
                    type="button"
                    onClick={resetReviewForm}
                    className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {reviews.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500">
                  Belum ada review direkodkan untuk tred ini.
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="grid gap-4 px-5 py-4 xl:grid-cols-[180px_160px_1fr_170px]"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase text-blue-600">
                        {review.workflow_stage}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {review.target_type}
                        {review.target_id ? ` #${review.target_id}` : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {review.reviewer_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {review.status}
                      </p>
                    </div>

                    <div>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          review.decision === "Approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : review.decision === "Rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {review.decision}
                      </span>
                      <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                        {review.comments || "Tiada komen"}
                      </p>
                    </div>

                    <div className="flex items-start justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditReview(review)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReview(review.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeWorkflow === "mapping" && (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                CMCS Reference
              </h2>
            </div>

            <div className="max-h-[680px] divide-y divide-slate-100 overflow-y-auto">
              {cmcsItems.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">
                  Tiada CMCS reference.
                </div>
              ) : (
                cmcsItems.map((item) => {
                  const isSelected = selectedCmcsId === String(item.id);
                  const mappedCount = mappings.filter(
                    (mapping) => mapping.cmcs_id === item.id,
                  ).length;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!editingMappingId) {
                          setSelectedCmcsId(String(item.id));
                          setSelectedUnitId("");
                          clearMappingDraft();
                        }
                      }}
                      className={[
                        "w-full px-6 py-4 text-left transition",
                        isSelected ? "bg-blue-50" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-blue-600">
                            {getCmcsLabel(item)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                        </div>

                        {mappedCount > 0 && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            {mappedCount} mapped
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {item.description || "Tiada penerangan"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                {editingMappingId
                  ? "Kemaskini CMCS Mapping"
                  : "Trade Interpretation"}
              </h2>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Selected Reference
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {selectedCmcs
                    ? `${getCmcsLabel(selectedCmcs)} ${selectedCmcs.title}`
                    : "Pilih CMCS di panel kiri"}
                </p>
                {selectedCmcs?.description && (
                  <p className="mt-2 text-xs text-slate-600">
                    {selectedCmcs.description}
                  </p>
                )}
              </div>

              {selectedCmcs && !editingMappingId && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      Blok interpretasi kosong
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Klik Jana AI untuk cadangan trade interpretation, kemudian
                      semak dan tekan Save.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAIDraft}
                    disabled={generatingAIDraft}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
                  >
                    {generatingAIDraft ? "Menjana..." : "Jana AI"}
                  </button>
                </div>
              )}

              <form onSubmit={handleAddMapping} className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <FieldHeader
                      title="Competency Unit CMCS"
                      description="Pilih unit khusus jika mapping hanya berkaitan satu unit. Biarkan semua unit jika keseluruhan CMCS relevan kepada tred."
                    />
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Semua Competency Unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.code || `CU-${String(unit.id).padStart(3, "0")}`}{" "}
                          {unit.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <FieldHeader
                      title="Tahap Relevan"
                      description="Tetapkan keutamaan mapping: High untuk kandungan utama modul, Medium untuk sokongan, Low untuk rujukan sampingan."
                    />
                    <select
                      value={relevanceLevel}
                      onChange={(e) => setRelevanceLevel(e.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="High">High Relevance</option>
                      <option value="Medium">Medium Relevance</option>
                      <option value="Low">Low Relevance</option>
                    </select>
                  </label>
                </div>

                {selectedUnit && (
                  <p className="text-xs text-slate-500">
                    CU selected: {selectedUnit.code || "CU"} - {selectedUnit.title}
                  </p>
                )}

                <label className="grid gap-2">
                  <FieldHeader
                    title="Trade Interpretation"
                    description="Huraikan bagaimana CMCS ini digunakan dalam konteks tred terpilih. Fokus kepada skop kerja, proses, pematuhan, risiko dan hasil kerja sebenar."
                  />
                  <textarea
                    value={tradeSpecificContent}
                    onChange={(e) => setTradeSpecificContent(e.target.value)}
                    placeholder="Contoh: Keperluan CMCS ini digunakan untuk kerja jambatan dari aspek kontrak, operasi tapak, kawalan mutu dan pematuhan agensi."
                    className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-blue-600">
                    Draft Module Content
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hasil mapping yang akan dibawa ke deraf modul, PL dan
                    assessment.
                  </p>
                </div>

                <label className="grid gap-2">
                  <FieldHeader
                    title="Tajuk Modul Cadangan"
                    description="Nama modul awal yang akan dibawa ke Module Builder. Tajuk perlu jelas menggabungkan CMCS dengan skop tred."
                  />
                  <input
                    value={draftModuleTitle}
                    onChange={(e) => setDraftModuleTitle(e.target.value)}
                    placeholder="Contoh: Pengurusan Operasi Kontraktor Kerja Jambatan"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <FieldHeader
                    title="Objektif Modul"
                    description="Nyatakan hasil pembelajaran utama. Gunakan ayat bermula dengan kemahiran yang peserta perlu kuasai selepas modul."
                  />
                  <textarea
                    value={draftObjective}
                    onChange={(e) => setDraftObjective(e.target.value)}
                    placeholder="Contoh: Membolehkan peserta mengurus operasi kerja jambatan mengikut keperluan CIDB, spesifikasi projek dan amalan keselamatan."
                    className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <FieldHeader
                    title="Outline Kandungan Modul"
                    description="Senaraikan topik utama yang perlu diajar. Bahagian ini akan menjadi asas kepada kandungan modul dan learning package."
                  />
                  <textarea
                    value={draftContentOutline}
                    onChange={(e) => setDraftContentOutline(e.target.value)}
                    placeholder={"Contoh:\n1. Keperluan pematuhan kerja jambatan\n2. Perancangan operasi tapak\n3. Kawalan mutu, keselamatan dan dokumentasi"}
                    className="min-h-40 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <FieldHeader
                      title="Cadangan Learning Package"
                      description="Pecahkan modul kepada PL kecil. Setiap PL sepatutnya boleh diajar, dilatih dan dinilai secara berasingan."
                    />
                    <textarea
                      value={suggestedLearningPackages}
                      onChange={(e) => setSuggestedLearningPackages(e.target.value)}
                      placeholder={"Contoh:\nPL01 - Pematuhan dan dokumentasi kerja\nPL02 - Operasi tapak dan kawalan mutu"}
                      className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </label>

                  <label className="grid gap-2">
                    <FieldHeader
                      title="Cadangan Assessment"
                      description="Cadangkan tugasan, soalan atau bukti penilaian yang boleh menguji penguasaan peserta terhadap modul."
                    />
                    <textarea
                      value={suggestedAssessmentAreas}
                      onChange={(e) => setSuggestedAssessmentAreas(e.target.value)}
                      placeholder={"Contoh:\n- Semak dokumen pematuhan\n- Sediakan pelan tindakan\n- Bentang justifikasi teknikal"}
                      className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <FieldHeader
                    title="Rasional Mapping"
                    description="Terangkan kenapa CMCS ini dipilih untuk tred. Bahagian ini membantu panel menyemak dan mempertahankan keputusan mapping."
                  />
                  <textarea
                    value={mappingNotes}
                    onChange={(e) => setMappingNotes(e.target.value)}
                    placeholder="Contoh: CMCS ini dipilih kerana ia menyokong kawalan operasi, pematuhan dan dokumentasi kerja jambatan dari peringkat tender hingga penutupan projek."
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                {mappingError && (
                  <p className="text-sm font-semibold text-red-600">
                    {mappingError}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingMapping}
                    className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingMapping
                      ? "Menyimpan..."
                      : editingMappingId
                        ? "Update Mapping"
                        : "Save"}
                  </button>

                  {!editingMappingId && (
                    <button
                      type="button"
                      onClick={handleGenerateAIDraft}
                      disabled={!selectedCmcsId || generatingAIDraft}
                      className="w-fit rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {generatingAIDraft ? "Menjana..." : "Jana AI"}
                    </button>
                  )}

                  {editingMappingId && (
                    <button
                      type="button"
                      onClick={resetMappingForm}
                      className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Saved Mapping
                </h2>
              </div>

              <div className="divide-y divide-slate-200">
                {mappings.length === 0 ? (
                  <div className="px-6 py-10 text-sm text-slate-500">
                    Belum ada mapping untuk tred ini.
                  </div>
                ) : (
                  mappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_150px_220px]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {mapping.competency_unit_title
                            ? `${mapping.competency_unit_code || "CU"} - ${mapping.competency_unit_title}`
                            : "All competency units"}
                        </p>

                        {mapping.trade_specific_content && (
                          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                            {mapping.trade_specific_content}
                          </p>
                        )}

                        {(mapping.draft_module_title ||
                          mapping.draft_objective ||
                          mapping.draft_content_outline) && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase text-blue-600">
                              Draft Module Content
                            </p>
                            {mapping.draft_module_title && (
                              <p className="mt-2 font-semibold text-slate-900">
                                {mapping.draft_module_title}
                              </p>
                            )}
                            {mapping.draft_objective && (
                              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                                {mapping.draft_objective}
                              </p>
                            )}
                            {mapping.draft_content_outline && (
                              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                                {mapping.draft_content_outline}
                              </p>
                            )}
                          </div>
                        )}

                        {(mapping.suggested_learning_packages ||
                          mapping.suggested_assessment_areas) && (
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {mapping.suggested_learning_packages && (
                              <div className="rounded-xl bg-blue-50 p-3">
                                <p className="text-xs font-bold uppercase text-blue-700">
                                  Suggested PL
                                </p>
                                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                                  {mapping.suggested_learning_packages}
                                </p>
                              </div>
                            )}

                            {mapping.suggested_assessment_areas && (
                              <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-xs font-bold uppercase text-emerald-700">
                                  Suggested Assessment
                                </p>
                                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                                  {mapping.suggested_assessment_areas}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {mapping.mapping_notes && (
                          <p className="mt-2 text-xs text-slate-500">
                            Notes: {mapping.mapping_notes}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {mapping.relevance_level}
                        </span>
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                        <button
                          onClick={() => handleEditMapping(mapping)}
                          className="h-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => draftCompetencyFromMapping(mapping)}
                          className="h-fit rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Draft TC
                        </button>

                        <button
                          onClick={() => draftModuleFromMapping(mapping)}
                          className="h-fit rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          Draft Module
                        </button>

                        <button
                          onClick={() =>
                            generateModulePackageAssessmentFromMapping(mapping)
                          }
                          disabled={generatingMappingId === mapping.id}
                          className="h-fit rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          {generatingMappingId === mapping.id
                            ? "Generating..."
                            : "Generate Module + PL"}
                        </button>

                        <button
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="h-fit rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
        )}

        {activeWorkflow === "competency" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Trade Competency Draft
          </h2>

          <form onSubmit={handleSaveCompetency} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-[160px_1fr_180px]">
              <input
                value={competencyCode}
                onChange={(e) => setCompetencyCode(e.target.value.toUpperCase())}
                placeholder="TC-01"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={competencyTitle}
                onChange={(e) => setCompetencyTitle(e.target.value)}
                placeholder="Trade-specific competency title"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={competencyStatus}
                onChange={(e) => setCompetencyStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <textarea
              value={competencyDescription}
              onChange={(e) => setCompetencyDescription(e.target.value)}
              placeholder="Competency scope, boundaries and authoring notes"
              className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {editingCompetencyId ? "Update Competency" : "+ Save Competency"}
              </button>

              {editingCompetencyId && (
                <button
                  type="button"
                  onClick={resetCompetencyForm}
                  className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {competencies.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                Belum ada trade competency draft.
              </div>
            ) : (
              competencies.map((competency) => (
                <div
                  key={competency.id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[120px_1fr_160px]"
                >
                  <div className="font-bold text-blue-600">
                    {competency.code || `TC-${String(competency.id).padStart(2, "0")}`}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {competency.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {competency.description || "Tiada penerangan"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editCompetency(competency)}
                      className="h-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => draftModuleFromCompetency(competency)}
                      className="h-fit rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Module
                    </button>

                    <button
                      onClick={() => deleteCompetency(competency.id)}
                      className="h-fit rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        )}

        {activeWorkflow === "modules" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            SKP Module Builder
          </h2>

          <form onSubmit={handleSaveModule} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-[160px_1fr_180px]">
              <input
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
                placeholder="M01"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Module title"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={moduleStatus}
                onChange={(e) => setModuleStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <textarea
              value={moduleObjective}
              onChange={(e) => setModuleObjective(e.target.value)}
              placeholder="Module objective"
              className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <textarea
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              placeholder="Module description / learning scope"
              className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {editingModuleId ? "Update Module" : "+ Save Module"}
              </button>

              {editingModuleId && (
                <button
                  type="button"
                  onClick={resetModuleForm}
                  className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {modules.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                Belum ada modul SKP.
              </div>
            ) : (
              modules.map((skpModule) => (
                <div
                  key={skpModule.id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[120px_1fr_160px]"
                >
                  <div className="font-bold text-blue-600">{skpModule.code}</div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {skpModule.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {skpModule.objective ||
                        skpModule.description ||
                        "Tiada penerangan"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editModule(skpModule)}
                      className="h-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => draftPackageFromModule(skpModule)}
                      className="h-fit rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      PL
                    </button>

                    <button
                      onClick={() => deleteModule(skpModule.id)}
                      className="h-fit rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>

                  {(learningPackages[skpModule.id] || []).length > 0 && (
                    <div className="md:col-span-3">
                      <div className="grid gap-2 rounded-lg bg-slate-50 p-3">
                        {(learningPackages[skpModule.id] || []).map((packageItem) => (
                          <div
                            key={packageItem.id}
                            className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2"
                          >
                            <div>
                              <p className="text-xs font-bold text-blue-600">
                                {packageItem.code}
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {packageItem.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {packageItem.objective || "Tiada objektif"}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => editPackage(packageItem)}
                                className="text-xs font-semibold text-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => draftQuestionFromPackage(packageItem)}
                                className="text-xs font-semibold text-emerald-700"
                              >
                                Assessment
                              </button>
                              <button
                                onClick={() => deletePackage(packageItem)}
                                className="text-xs font-semibold text-red-600"
                              >
                                Delete
                              </button>
                            </div>

                            {(assessmentQuestions[packageItem.id] || []).length >
                              0 && (
                              <div className="basis-full rounded-lg bg-slate-50 p-3">
                                {(assessmentQuestions[packageItem.id] || []).map(
                                  (question) => (
                                    <div
                                      key={question.id}
                                      className="mt-2 flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2 first:mt-0"
                                    >
                                      <div>
                                        <p className="text-xs font-bold uppercase text-indigo-700">
                                          {question.question_type} |{" "}
                                          {question.marks} markah
                                        </p>
                                        <p className="mt-1 text-xs text-slate-700">
                                          {question.question_text}
                                        </p>
                                      </div>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => editQuestion(question)}
                                          className="text-xs font-semibold text-blue-600"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => deleteQuestion(question)}
                                          className="text-xs font-semibold text-red-600"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
        )}

        {activeWorkflow === "learning" && activeModuleId && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Learning Package Builder
            </h2>

            <form onSubmit={handleSavePackage} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-[160px_1fr_180px]">
                <input
                  value={packageCode}
                  onChange={(e) => setPackageCode(e.target.value.toUpperCase())}
                  placeholder="PL01"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <input
                  value={packageTitle}
                  onChange={(e) => setPackageTitle(e.target.value)}
                  placeholder="Learning package title"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <select
                  value={packageStatus}
                  onChange={(e) => setPackageStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>

              <textarea
                value={packageObjective}
                onChange={(e) => setPackageObjective(e.target.value)}
                placeholder="Learning objective"
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <textarea
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Description"
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <textarea
                value={packageOutline}
                onChange={(e) => setPackageOutline(e.target.value)}
                placeholder="Structured content outline / subtopics"
                className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingPackageId ? "Update PL" : "+ Save PL"}
                </button>

                <button
                  type="button"
                  onClick={resetPackageForm}
                  className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {activeWorkflow === "learning" && !activeModuleId && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Learning Package Builder
            </h2>

            {packageCount === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                Pilih button PL pada mana-mana SKP Module untuk mula bina learning
                package.
              </p>
            ) : (
              <div className="mt-5 grid gap-3">
                {modules.map((skpModule) =>
                  (learningPackages[skpModule.id] || []).map((packageItem) => (
                    <div
                      key={packageItem.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="text-xs font-bold text-blue-600">
                          {skpModule.code} / {packageItem.code}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {packageItem.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {packageItem.objective || "Tiada objektif"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => editPackage(packageItem)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => draftQuestionFromPackage(packageItem)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Assessment
                        </button>
                      </div>
                    </div>
                  )),
                )}
              </div>
            )}
          </section>
        )}

        {activeWorkflow === "assessment" && activePackageId && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Assessment Builder
            </h2>

            <form onSubmit={handleSaveQuestion} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-[1fr_140px_180px]">
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Subjective">Subjective</option>
                  <option value="MCQ">MCQ</option>
                  <option value="Practical">Practical Task</option>
                </select>

                <input
                  type="number"
                  min={1}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <select
                  value={questionStatus}
                  onChange={(e) => setQuestionStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>

              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Question text / practical task instruction"
                className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <textarea
                value={answerScheme}
                onChange={(e) => setAnswerScheme(e.target.value)}
                placeholder="Answer scheme"
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <textarea
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Rubric / marking guide"
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingQuestionId ? "Update Question" : "+ Save Question"}
                </button>

                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {activeWorkflow === "assessment" && !activePackageId && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Assessment Builder
            </h2>

            {packageCount === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                Pilih button Assessment pada mana-mana Learning Package untuk mula
                bina soalan, skema jawapan dan rubrik.
              </p>
            ) : (
              <div className="mt-5 grid gap-3">
                {modules.map((skpModule) =>
                  (learningPackages[skpModule.id] || []).map((packageItem) => (
                    <div
                      key={packageItem.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-blue-600">
                            {skpModule.code} / {packageItem.code}
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {packageItem.title}
                          </p>
                        </div>

                        <button
                          onClick={() => draftQuestionFromPackage(packageItem)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Add Question
                        </button>
                      </div>

                      {(assessmentQuestions[packageItem.id] || []).length > 0 && (
                        <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">
                          {(assessmentQuestions[packageItem.id] || []).map(
                            (question) => (
                              <div
                                key={question.id}
                                className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2"
                              >
                                <div>
                                  <p className="text-xs font-bold uppercase text-indigo-700">
                                    {question.question_type} | {question.marks} markah
                                  </p>
                                  <p className="mt-1 text-xs text-slate-700">
                                    {question.question_text}
                                  </p>
                                </div>
                                <button
                                  onClick={() => editQuestion(question)}
                                  className="text-xs font-semibold text-blue-600"
                                >
                                  Edit
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )),
                )}
              </div>
            )}
          </section>
        )}

        {activeWorkflow === "preview" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                SKP Document Preview
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {trade.code} - {trade.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {trade.description || "Tiada penerangan direkodkan."}
              </p>
            </div>

            <div className="mt-8 space-y-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Document Health
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Semakan kelengkapan sebelum export.
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold",
                      healthIssues.length === 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {healthIssues.length === 0
                      ? "Ready"
                      : `${healthIssues.length} issue`}
                  </span>
                </div>

                {healthIssues.length > 0 && (
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {healthIssues.map((issue, index) => (
                      <div
                        key={`${issue.label}-${issue.detail}-${index}`}
                        className="rounded-lg bg-white px-3 py-2"
                      >
                        <p className="text-xs font-bold text-amber-700">
                          {issue.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {issue.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  1. CMCS Mapping Matrix
                </h3>

                {mappings.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Belum ada mapping direkodkan.
                  </p>
                ) : (
                  <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
                    {mappings.map((mapping) => (
                      <div key={mapping.id} className="grid gap-4 p-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">
                            CMCS Reference
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {mapping.competency_unit_title || "All competency units"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Trade Interpretation
                          </p>
                          {!mapping.trade_specific_content?.trim() && (
                            <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                              Needs interpretation
                            </span>
                          )}
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                            {mapping.trade_specific_content || "Tiada tafsiran"}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Draft Module Content
                          </p>
                          {!mapping.draft_module_title?.trim() &&
                            !mapping.draft_content_outline?.trim() && (
                              <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                Needs draft content
                              </span>
                            )}
                          {mapping.draft_module_title && (
                            <p className="mt-2 font-semibold text-slate-900">
                              {mapping.draft_module_title}
                            </p>
                          )}
                          {mapping.draft_objective && (
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                              {mapping.draft_objective}
                            </p>
                          )}
                          {mapping.draft_content_outline && (
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                              {mapping.draft_content_outline}
                            </p>
                          )}
                          {(mapping.suggested_learning_packages ||
                            mapping.suggested_assessment_areas) && (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {mapping.suggested_learning_packages && (
                                <div className="rounded-lg bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase text-slate-500">
                                    Suggested PL
                                  </p>
                                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                                    {mapping.suggested_learning_packages}
                                  </p>
                                </div>
                              )}
                              {mapping.suggested_assessment_areas && (
                                <div className="rounded-lg bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase text-slate-500">
                                    Suggested Assessment
                                  </p>
                                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                                    {mapping.suggested_assessment_areas}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  2. Trade Competency Draft
                </h3>

                {competencies.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Belum ada competency draft.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {competencies.map((competency) => (
                      <div
                        key={competency.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="text-xs font-bold text-blue-600">
                          {competency.code || `TC-${competency.id}`}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {competency.title}
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                          {competency.description || "Tiada penerangan"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  3. SKP Module, Learning Package & Assessment
                </h3>

                {modules.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Belum ada modul SKP.
                  </p>
                ) : (
                  <div className="mt-4 space-y-5">
                    {modules.map((skpModule) => (
                      <div
                        key={skpModule.id}
                        className="rounded-xl border border-slate-200 p-5"
                      >
                        <p className="text-xs font-bold text-blue-600">
                          {skpModule.code}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {skpModule.title}
                        </p>
                        {modulesWithoutSource.some(
                          (item) => item.id === skpModule.id,
                        ) && (
                          <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                            Source competency missing
                          </span>
                        )}
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                          {skpModule.objective ||
                            skpModule.description ||
                            "Tiada objektif"}
                        </p>

                        {(learningPackages[skpModule.id] || []).length === 0 ? (
                          <p className="mt-4 text-sm text-slate-500">
                            Belum ada learning package.
                          </p>
                        ) : (
                          <div className="mt-5 space-y-4">
                            {(learningPackages[skpModule.id] || []).map(
                              (packageItem) => (
                                <div
                                  key={packageItem.id}
                                  className="rounded-lg bg-slate-50 p-4"
                                >
                                  <p className="text-xs font-bold text-slate-500">
                                    {packageItem.code}
                                  </p>
                                  <p className="mt-1 font-semibold text-slate-900">
                                    {packageItem.title}
                                  </p>
                                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                                    {packageItem.objective ||
                                      packageItem.description ||
                                      "Tiada objektif"}
                                  </p>

                                  {packageItem.content_outline && (
                                    <div className="mt-3">
                                      <p className="text-xs font-bold uppercase text-slate-500">
                                        Content Outline
                                      </p>
                                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                                        {packageItem.content_outline}
                                      </p>
                                    </div>
                                  )}

                                  {!packageItem.content_outline?.trim() && (
                                    <span className="mt-3 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                      Needs content outline
                                    </span>
                                  )}

                                  {(assessmentQuestions[packageItem.id] || [])
                                    .length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-xs font-bold uppercase text-slate-500">
                                        Assessment
                                      </p>
                                      <div className="mt-2 grid gap-2">
                                        {(
                                          assessmentQuestions[packageItem.id] || []
                                        ).map((question, index) => (
                                          <div
                                            key={question.id}
                                            className="rounded-lg border border-slate-200 bg-white p-3"
                                          >
                                            <p className="text-xs font-bold text-indigo-700">
                                              Q{index + 1} |{" "}
                                              {question.question_type} |{" "}
                                              {question.marks} markah
                                            </p>
                                            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                                              {question.question_text}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {(assessmentQuestions[packageItem.id] || [])
                                    .length === 0 && (
                                    <span className="mt-3 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                      Needs assessment
                                    </span>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
