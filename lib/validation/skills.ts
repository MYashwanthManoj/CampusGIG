import { z } from 'zod';

export const SKILL_SLUGS = ['react', 'nextjs', 'css', 'uiux', 'python', 'design', 'video', 'spreadsheet', 'writing'] as const;
export const skillSlugSchema = z.enum(SKILL_SLUGS);
export type SkillSlug = z.infer<typeof skillSlugSchema>;
export const SKILL_NAMES: Record<SkillSlug, string> = {
  react: 'React', nextjs: 'Next.js', css: 'CSS', uiux: 'UI/UX', python: 'Python',
  design: 'Design', video: 'Video', spreadsheet: 'Spreadsheet', writing: 'Writing',
};

/** Normalization belongs at input boundaries, never fuzzy-matches unrelated skills. */
export function normalizeSkillSlug(value: string): SkillSlug | null {
  const key = value.trim().toLowerCase().replace(/[\s._/+-]/g, '');
  const aliases: Record<string, SkillSlug> = {
    react: 'react', reactjs: 'react', next: 'nextjs', nextjs: 'nextjs', css: 'css',
    css3: 'css', uiux: 'uiux', uxui: 'uiux', python: 'python', python3: 'python',
    design: 'design', graphicdesign: 'design', video: 'video', videoediting: 'video',
    spreadsheet: 'spreadsheet', spreadsheets: 'spreadsheet', excel: 'spreadsheet',
    googlesheets: 'spreadsheet', writing: 'writing', contentwriting: 'writing',
  };
  return Object.hasOwn(aliases, key) ? aliases[key]! : null;
}

export const canonicalSkillsSchema = z.array(skillSlugSchema).max(6).refine(
  (skills) => new Set(skills).size === skills.length,
  'Skills must be unique canonical slugs',
);