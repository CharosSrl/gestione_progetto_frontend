// Maps domain enums to friendly labels + CSS custom-property colors used by the badge.

export interface StatusMeta {
  label: string;
  fg: string; // css var name for foreground/dot color
  bg: string; // css var name for background
}

const PRODUCT: Record<string, StatusMeta> = {
  ideation: { label: 'Ideation', fg: '--c-ideation', bg: '--c-ideation-bg' },
  definition: { label: 'Definition', fg: '--c-definition', bg: '--c-definition-bg' },
  development: { label: 'Development', fg: '--c-development', bg: '--c-development-bg' },
};

const FEATURE: Record<string, StatusMeta> = {
  idea: { label: 'Idea', fg: '--c-ideation', bg: '--c-ideation-bg' },
  backlog: { label: 'Backlog', fg: '--c-muted', bg: '--c-muted-bg' },
  in_progress: { label: 'In progress', fg: '--c-warning', bg: '--c-warning-bg' },
  done: { label: 'Done', fg: '--c-success', bg: '--c-success-bg' },
  rejected: { label: 'Rejected', fg: '--c-danger', bg: '--c-danger-bg' },
};

const SPRINT: Record<string, StatusMeta> = {
  planned: { label: 'Planned', fg: '--c-ideation', bg: '--c-ideation-bg' },
  active: { label: 'Active', fg: '--c-development', bg: '--c-development-bg' },
  completed: { label: 'Completed', fg: '--c-muted', bg: '--c-muted-bg' },
};

const TASK: Record<string, StatusMeta> = {
  todo: { label: 'To do', fg: '--c-muted', bg: '--c-muted-bg' },
  in_progress: { label: 'In progress', fg: '--c-warning', bg: '--c-warning-bg' },
  done: { label: 'Done', fg: '--c-success', bg: '--c-success-bg' },
};

const MOSCOW: Record<string, StatusMeta> = {
  must: { label: 'Must', fg: '--c-danger', bg: '--c-danger-bg' },
  should: { label: 'Should', fg: '--c-warning', bg: '--c-warning-bg' },
  could: { label: 'Could', fg: '--c-ideation', bg: '--c-ideation-bg' },
  wont: { label: "Won't", fg: '--c-muted', bg: '--c-muted-bg' },
};

const FALLBACK: StatusMeta = { label: '—', fg: '--c-muted', bg: '--c-muted-bg' };

export type StatusKind = 'product' | 'feature' | 'sprint' | 'task' | 'moscow';

const TABLES: Record<StatusKind, Record<string, StatusMeta>> = {
  product: PRODUCT,
  feature: FEATURE,
  sprint: SPRINT,
  task: TASK,
  moscow: MOSCOW,
};

export function statusMeta(kind: StatusKind, value: string | null | undefined): StatusMeta {
  if (!value) return FALLBACK;
  return TABLES[kind][value] ?? { ...FALLBACK, label: value };
}
