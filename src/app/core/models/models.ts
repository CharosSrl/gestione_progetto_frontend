// Domain models mirroring the Product Lifecycle Tracker OpenAPI schemas.

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'ideation' | 'definition' | 'development';

export interface ProductInput {
  name: string;
  description?: string | null;
  status?: ProductStatus;
}

export interface Product extends Timestamps {
  id: string;
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
