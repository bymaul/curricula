import { generateText, NoObjectGeneratedError, Output } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import { AIAdjustScope, RENDERABLE_SECTIONS } from '@/lib/consts';
import { CVData, initialCVState } from '@/lib/schema';

export const MAX_CV_TEXT_CHARS = 12_000;
export const MAX_CV_IMAGES = 6;
export const MAX_CV_IMAGE_BASE64_CHARS = 1_500_000;
export const MAX_REPAIR_ATTEMPTS = 2;
export const MAX_TRANSIENT_RETRIES = 2;

const optionalString = z.string().optional();

/**
 * Tolerant parse schema: every field is optional so a resume that is
 * genuinely missing data (no email, no phone, sparse summary) still parses.
 * `normalizeCVOutput` fills gaps afterwards.
 */
export const cvParseSchema = z.object({
  name: optionalString,
  jobTitle: optionalString,
  email: optionalString,
  phone: optionalString,
  location: optionalString,
  links: z.array(z.object({ url: optionalString })).optional(),
  summary: optionalString,
  experience: z
    .array(
      z.object({
        role: optionalString,
        company: optionalString,
        date: optionalString,
        location: optionalString,
        description: optionalString,
      }),
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: optionalString,
        date: optionalString,
        description: optionalString,
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: optionalString,
        institution: optionalString,
        date: optionalString,
        location: optionalString,
        description: optionalString,
      }),
    )
    .optional(),
  skills: z
    .array(
      z.object({
        category: optionalString,
        items: optionalString,
      }),
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: optionalString,
        issuer: optionalString,
        date: optionalString,
      }),
    )
    .optional(),
});

export interface CVImagePart {
  data: string;
  mimeType: string;
}

export interface CVParseResult {
  data: CVData;
  warnings: string[];
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Collapses blank lines and caps the resume text to control cost. */
export function normalizeCVText(text: string): string {
  const collapsed = text.replace(/\n{3,}/g, '\n\n').trim();
  if (collapsed.length <= MAX_CV_TEXT_CHARS) return collapsed;
  const cut = collapsed.slice(0, MAX_CV_TEXT_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, lastSpace > 0 ? lastSpace : MAX_CV_TEXT_CHARS).trim();
}

/** Pulls the first balanced JSON object out of text (handles fences/prose). */
export function extractJSON(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const slice = candidate.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Coerces arbitrary AI output into a valid CVData and derives review
 * warnings for fields the model could not find.
 */
export function normalizeCVOutput(raw: unknown): CVParseResult {
  const obj = isRecord(raw) ? raw : {};

  const links = Array.isArray(obj.links)
    ? obj.links.filter(isRecord).map((l) => ({ url: asString(l.url) }))
    : [];

  const experience = Array.isArray(obj.experience)
    ? obj.experience.filter(isRecord).map((e) => ({
        role: asString(e.role),
        company: asString(e.company),
        date: asString(e.date),
        location: asString(e.location),
        description: asString(e.description),
      }))
    : [];

  const projects = Array.isArray(obj.projects)
    ? obj.projects.filter(isRecord).map((p) => ({
        name: asString(p.name),
        date: asString(p.date),
        description: asString(p.description),
      }))
    : [];

  const education = Array.isArray(obj.education)
    ? obj.education.filter(isRecord).map((e) => ({
        degree: asString(e.degree),
        institution: asString(e.institution),
        date: asString(e.date),
        location: asString(e.location),
        description: asString(e.description),
      }))
    : [];

  const skills = Array.isArray(obj.skills)
    ? obj.skills.filter(isRecord).map((s) => ({
        category: asString(s.category),
        items: asString(s.items),
      }))
    : [];

  const certifications = Array.isArray(obj.certifications)
    ? obj.certifications.filter(isRecord).map((c) => ({
        name: asString(c.name),
        issuer: asString(c.issuer),
        date: asString(c.date),
      }))
    : [];

  const summary = asString(obj.summary);

  const data: CVData = {
    ...initialCVState,
    name: asString(obj.name),
    jobTitle: asString(obj.jobTitle),
    email: asString(obj.email),
    phone: asString(obj.phone),
    location: asString(obj.location),
    links,
    summary,
    experience,
    projects,
    education,
    skills,
    certifications,
  };

  const warnings: string[] = [];
  if (!data.name.trim()) warnings.push('Name not found');
  if (!data.email.trim()) warnings.push('Email not found');
  if (!data.phone.trim()) warnings.push('Phone not found');
  if (data.summary.trim().length < 10)
    warnings.push('Summary is missing or too short');
  if (data.experience.length === 0 && data.projects.length === 0)
    warnings.push('No experience or projects found');

  return { data, warnings };
}

function validationMessage(cause: unknown): string {
  if (isRecord(cause) && Array.isArray(cause.issues)) {
    const messages = cause.issues
      .map((issue) => (isRecord(issue) ? asString(issue.message) : ''))
      .filter(Boolean);
    if (messages.length > 0) return messages.join('; ');
  }
  return cause instanceof Error ? cause.message : String(cause);
}

function buildUserContent(text: string, imageParts: CVImagePart[] | undefined) {
  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: string; mediaType: string }
  > = [];
  if (imageParts && imageParts.length > 0) {
    for (const img of imageParts) {
      parts.push({
        type: 'image',
        image: img.data,
        mediaType: img.mimeType,
      });
    }
  }
  parts.push({ type: 'text', text });
  return parts;
}

function buildRepairPrompt(
  context: string,
  invalidOutput: string,
  errors: string,
): string {
  return `The previous attempt did not produce a valid JSON object.

Input:
${context || '(empty)'}

Previous invalid output:
${invalidOutput || '(empty)'}

Validation errors:
${errors || 'Could not parse the output as JSON.'}

Return ONLY a single corrected JSON object with the requested structured data. Do not use markdown code fences.`;
}

interface GenerateJSONWithRepairOptions {
  model: LanguageModel;
  system: string;
  prompt: string;
  imageParts?: CVImagePart[];
  repairContext: string;
  maxRetries?: number;
  maxRepairAttempts?: number;
}

/**
 * Core AI call: structured JSON output with transient retries and a schema
 * repair loop. On `NoObjectGeneratedError` it first salvages valid JSON from
 * the raw text, then re-prompts the model with the previous output and
 * validation errors (images re-included each time).
 */
async function generateJSONWithRepair({
  model,
  system,
  prompt,
  imageParts,
  repairContext,
  maxRetries = MAX_TRANSIENT_RETRIES,
  maxRepairAttempts = MAX_REPAIR_ATTEMPTS,
}: GenerateJSONWithRepairOptions): Promise<CVParseResult> {
  let currentPrompt = prompt;
  let invalidOutput = '';
  let errors = '';

  for (let attempt = 0; attempt <= maxRepairAttempts; attempt++) {
    try {
      const result = await generateText({
        model,
        system,
        messages: [
          {
            role: 'user',
            content: buildUserContent(currentPrompt, imageParts),
          },
        ],
        output: Output.object({ schema: cvParseSchema }),
        maxRetries,
      });
      return normalizeCVOutput(result.output);
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;

      const salvaged = extractJSON(
        (error as NoObjectGeneratedError).text ?? '',
      );
      if (salvaged !== null) {
        return normalizeCVOutput(salvaged);
      }

      invalidOutput = (error as NoObjectGeneratedError).text ?? '';
      errors = validationMessage((error as NoObjectGeneratedError).cause);

      if (attempt >= maxRepairAttempts) break;
      currentPrompt = buildRepairPrompt(repairContext, invalidOutput, errors);
    }
  }

  throw new Error(
    'Could not generate the requested output with AI. Please try again.',
  );
}

export interface ParseCVWithRepairOptions {
  model: LanguageModel;
  system: string;
  resumeText: string;
  imageParts?: CVImagePart[];
  maxRetries?: number;
  maxRepairAttempts?: number;
}

/**
 * Parses resume text (and optional page images) into structured CV data.
 * See `generateJSONWithRepair` for the retry/repair behavior.
 */
export async function parseCVWithRepair(
  options: ParseCVWithRepairOptions,
): Promise<CVParseResult> {
  const {
    model,
    system,
    resumeText,
    imageParts,
    maxRetries,
    maxRepairAttempts,
  } = options;

  const prompt = `Extract structured data from the resume below and return a single JSON object matching the requested schema. If the resume text is empty or incomplete, use the accompanying page images.

Resume text:
${resumeText || '(empty — use the page images)'}`;

  return generateJSONWithRepair({
    model,
    system,
    prompt,
    imageParts,
    repairContext: `Resume text:\n${resumeText || '(empty — use the page images above)'}`,
    maxRetries,
    maxRepairAttempts,
  });
}

export interface AdjustCVWithRepairOptions {
  model: LanguageModel;
  system: string;
  cvData: CVData;
  jobDescription: string;
  scope?: AIAdjustScope;
  maxRetries?: number;
  maxRepairAttempts?: number;
}

function buildAdjustPrompt(
  scope: AIAdjustScope | undefined,
  input: string,
): string {
  if (!scope || scope === 'full') {
    return `Rewrite the CV to match the job description and return the adjusted CV as a single JSON object matching the requested schema.\n\n${input}`;
  }

  const sectionName =
    RENDERABLE_SECTIONS.find((section) => section.id === scope)?.title ?? scope;

  return `Rewrite ONLY the ${sectionName} section of the CV to match the job description. Return the complete adjusted CV as a single JSON object matching the requested schema, with every other field byte-for-byte identical to the source CV.\n\n${input}`;
}

const ADJUST_SCOPE_FIELD: Record<
  Exclude<AIAdjustScope, 'full'>,
  keyof CVData
> = {
  summary: 'summary',
  experience: 'experience',
  projects: 'projects',
  education: 'education',
  skills: 'skills',
};

function scopeFieldHasValue(
  field: keyof CVData,
  value: CVData[typeof field],
): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

/**
 * Scoped adjusts cannot trust the model to leave unrelated fields alone.
 * Merge the targeted field from the AI result back into the original CV and
 * keep every other field from the source. If the model returned nothing for
 * the targeted section, keep the source untouched and surface a warning.
 */
function applyScope(
  scope: Exclude<AIAdjustScope, 'full'>,
  cvData: CVData,
  result: CVParseResult,
): CVParseResult {
  const field = ADJUST_SCOPE_FIELD[scope];
  const candidate = result.data[field];

  if (!scopeFieldHasValue(field, candidate)) {
    const title =
      RENDERABLE_SECTIONS.find((section) => section.id === scope)?.title ??
      scope;
    return {
      data: cvData,
      warnings: [`Could not adjust the ${title} section.`],
    };
  }

  return { data: { ...cvData, [field]: candidate }, warnings: [] };
}

/**
 * Rewrites a CV to align with a job description, returning the adjusted
 * `CVData` plus review warnings. See `generateJSONWithRepair` for the
 * retry/repair behavior.
 */
export async function adjustCVWithRepair(
  options: AdjustCVWithRepairOptions,
): Promise<CVParseResult> {
  const {
    model,
    system,
    cvData,
    jobDescription,
    scope,
    maxRetries,
    maxRepairAttempts,
  } = options;

  const cvText = JSON.stringify(cvData);
  const input = `CV Data:\n${cvText}\n\nJob Description:\n${jobDescription}`;
  const prompt = buildAdjustPrompt(scope, input);

  const result = await generateJSONWithRepair({
    model,
    system,
    prompt,
    repairContext: input,
    maxRetries,
    maxRepairAttempts,
  });

  if (!scope || scope === 'full') return result;
  return applyScope(scope, cvData, result);
}
