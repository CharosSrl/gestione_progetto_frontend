import { GrowthSection } from '../../../core/models/models';

export interface GrowthSectionDef {
  key: GrowthSection;
  label: string;
  emoji: string;
  hint: string;
  fields: string[];
}

/**
 * Fixed growth-canvas scaffold — section → fields, mirroring the OpenAPI
 * `GrowthSection` field sets. Notes from the API are slotted into these fields.
 */
export const GROWTH_SECTIONS: GrowthSectionDef[] = [
  {
    key: 'project_overview',
    label: 'Project overview',
    emoji: '🧭',
    hint: 'Who it’s for and why it wins',
    fields: ['unique_value_proposition', 'secret_sauce', 'core_value', 'target_customers', 'why'],
  },
  {
    key: 'metrics',
    label: 'Metrics',
    emoji: '📐',
    hint: 'How you measure success',
    fields: ['formula', 'north_star_metric'],
  },
  {
    key: 'retention',
    label: 'Retention',
    emoji: '🔁',
    hint: 'Keeping people coming back',
    fields: ['short_term', 'medium_term', 'long_term'],
  },
  {
    key: 'acquisition',
    label: 'Acquisition',
    emoji: '🎯',
    hint: 'How you reach new users',
    fields: ['language_market_fit', 'channel_product_fit'],
  },
  {
    key: 'toolbox',
    label: 'Toolbox',
    emoji: '🧰',
    hint: 'Instrumentation & research',
    fields: ['data_mining', 'social_tracking', 'ads_tracking', 'surveys', 'other'],
  },
  {
    key: 'high_tempo_testing',
    label: 'High-tempo testing',
    emoji: '⚡',
    hint: 'Your experiment cadence',
    fields: ['framework', 'frequency'],
  },
  {
    key: 'customer_loops',
    label: 'Customer loops',
    emoji: '♻️',
    hint: 'Self-reinforcing growth loops',
    fields: ['payload', 'conversion_rate', 'frequency'],
  },
];

/** "north_star_metric" → "North star metric". */
export function humaniseField(field: string): string {
  const s = field.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
