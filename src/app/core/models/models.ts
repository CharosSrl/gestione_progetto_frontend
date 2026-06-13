// Domain models mirroring the Product Lifecycle Tracker OpenAPI schemas.

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Envelope returned by every list endpoint: `{ data, meta }`. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export type ProductStatus = 'ideation' | 'definition' | 'development';

export interface ProductInput {
  name: string;
  description?: string | null;
  status?: ProductStatus;
}

export interface Product extends Timestamps {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  status: ProductStatus;
}

export interface ProductWithCounts extends Product {
  _count?: {
    features: number;
    sprints: number;
    kpis: number;
  };
}

export type FeaturePhase = 'ideation' | 'definition' | 'development';
export type PriorityMethod = 'rice' | 'moscow';
export type MoscowCategory = 'must' | 'should' | 'could' | 'wont';
export type FeatureStatus = 'idea' | 'backlog' | 'in_progress' | 'done' | 'rejected';

export interface FeatureInput {
  title: string;
  description?: string | null;
  phase?: FeaturePhase;
  priorityMethod?: PriorityMethod;
  riceReach?: number | null;
  riceImpact?: number | null;
  riceConfidence?: number | null; // 0..1
  riceEffort?: number | null;
  moscowCategory?: MoscowCategory | null;
  status?: FeatureStatus;
}

export interface Feature extends Timestamps, FeatureInput {
  id: string;
  productId: string;
}

export type SprintStatus = 'planned' | 'active' | 'completed';

export interface SprintInput {
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: SprintStatus;
}

export interface Sprint extends Timestamps, SprintInput {
  id: string;
  productId: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  estimatedHours?: number | null;
  actualHours?: number | null;
  featureId?: string | null;
}

export interface Task extends Timestamps, TaskInput {
  id: string;
  sprintId: string;
}

export interface KpiInput {
  name: string;
  description?: string | null;
  unit: string;
  targetValue?: number | null;
  currentValue?: number | null;
}

export interface Kpi extends Timestamps, KpiInput {
  id: string;
  productId: string;
}

export interface KpiValueInput {
  value: number;
  recordedAt?: string;
}

export interface KpiValue {
  id: string;
  kpiId: string;
  value: number;
  recordedAt: string;
}

export interface KpiWithValues extends Kpi {
  values: KpiValue[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Array<{ field?: string; message?: string }>;
}

// Compute the RICE score: (reach * impact * confidence) / effort.
export function riceScore(f: Pick<FeatureInput, 'riceReach' | 'riceImpact' | 'riceConfidence' | 'riceEffort'>): number | null {
  const { riceReach, riceImpact, riceConfidence, riceEffort } = f;
  if (riceReach == null || riceImpact == null || riceConfidence == null || riceEffort == null || riceEffort === 0) {
    return null;
  }
  return (riceReach * riceImpact * riceConfidence) / riceEffort;
}

// --- Growth: hacking canvas (notes) ------------------------------------------

export type GrowthSection =
  | 'project_overview'
  | 'metrics'
  | 'retention'
  | 'acquisition'
  | 'toolbox'
  | 'high_tempo_testing'
  | 'customer_loops';

export interface GrowthNoteCreate {
  section: GrowthSection;
  field: string;
  content: string;
  order?: number;
}

export interface GrowthNotePatch {
  content?: string;
  order?: number;
}

export interface GrowthNote extends Timestamps {
  id: string;
  productId: string;
  section: GrowthSection;
  field: string;
  content: string;
  order: number;
}

/** Map of field name → ordered notes. */
export type FieldNotes = Record<string, GrowthNote[]>;

/** Full canvas: every section present, grouped by field. */
export type GrowthCanvas = Record<GrowthSection, FieldNotes>;

// --- Growth: experiments (high-tempo testing, RICE) --------------------------

export type ExperimentStatus = 'backlog' | 'running' | 'done';
export type ExperimentOutcome = 'validated' | 'invalidated' | 'inconclusive';

export interface GrowthExperimentInput {
  hypothesis?: string | null;
  section?: GrowthSection;
  metric?: string | null;
  riceReach?: number | null;
  riceImpact?: number | null;
  riceConfidence?: number | null; // 0..1
  riceEffort?: number | null;
  status?: ExperimentStatus;
  outcome?: ExperimentOutcome;
  learning?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface GrowthExperimentCreate extends GrowthExperimentInput {
  title: string;
}

export interface GrowthExperimentPatch extends GrowthExperimentInput {
  title?: string;
}

export interface GrowthExperiment extends Timestamps, GrowthExperimentInput {
  id: string;
  productId: string;
  title: string;
  status: ExperimentStatus;
}
