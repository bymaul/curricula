import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', () => {
  class NoObjectGeneratedError extends Error {
    static isInstance(error: unknown) {
      return error instanceof NoObjectGeneratedError;
    }
    text: string;
    cause: unknown;
    constructor(options: { message?: string; text?: string; cause?: unknown }) {
      super(options.message ?? 'No object generated.');
      this.text = options.text ?? '';
      this.cause = options.cause;
    }
  }
  return {
    generateText: vi.fn(),
    NoObjectGeneratedError,
    Output: { object: vi.fn(() => ({ type: 'object' })) },
  };
});

import { generateText, NoObjectGeneratedError } from 'ai';
import {
  adjustCVWithRepair,
  extractJSON,
  normalizeCVOutput,
  normalizeCVText,
  parseCVWithRepair,
} from '@/lib/cvParsing';
import { CVData } from '@/lib/schema';

const mockedGenerateText = vi.mocked(generateText);

const validResume = {
  name: 'Jane Doe',
  jobTitle: 'Engineer',
  email: 'jane@example.com',
  phone: '+1-555-0100',
  summary: 'Experienced engineer with 8 years building web apps.',
  experience: [
    {
      role: 'Dev',
      company: 'Acme',
      date: '2020-2022',
      description: '- Led team.',
    },
  ],
  projects: [],
  education: [],
  skills: [{ category: '', items: 'JavaScript' }],
  certifications: [],
};

const minimalModel = {} as Parameters<typeof parseCVWithRepair>[0]['model'];

const noObjectError = (text: string) =>
  new NoObjectGeneratedError({ text } as never);

describe('normalizeCVText', () => {
  it('collapses runs of blank lines', () => {
    expect(normalizeCVText('a\n\n\n\n\nb')).toBe('a\n\nb');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeCVText('  hello  \n  world  ')).toBe('hello  \n  world');
  });

  it('caps length at MAX_CV_TEXT_CHARS without splitting words', () => {
    const long = `${'word '.repeat(5000)}end`;
    const out = normalizeCVText(long);
    expect(out.length).toBeLessThanOrEqual(12_000);
    expect(out).not.toContain('end');
  });
});

describe('extractJSON', () => {
  it('parses plain JSON objects', () => {
    expect(extractJSON('{"a":1}')).toEqual({ a: 1 });
  });

  it('extracts JSON wrapped in markdown fences', () => {
    const fenced = '```json\n{"name":"Bob"}\n```';
    expect(extractJSON(fenced)).toEqual({ name: 'Bob' });
  });

  it('extracts JSON embedded in prose', () => {
    const prose = 'Here you go: {"name":"Al"} thanks!';
    expect(extractJSON(prose)).toEqual({ name: 'Al' });
  });

  it('ignores strings containing braces', () => {
    const tricky = '{"note":"a} still in string","x":1}';
    expect(extractJSON(tricky)).toEqual({ note: 'a} still in string', x: 1 });
  });

  it('returns null for non-JSON input', () => {
    expect(extractJSON('just some text')).toBeNull();
    expect(extractJSON('')).toBeNull();
  });
});

describe('normalizeCVOutput', () => {
  it('coerces a complete object into CVData', () => {
    const { data, warnings } = normalizeCVOutput(validResume);
    expect(data.name).toBe('Jane Doe');
    expect(data.experience[0].description).toBe('- Led team.');
    expect(warnings).toEqual([]);
  });

  it('fills missing fields with empty values and derives warnings', () => {
    const { data, warnings } = normalizeCVOutput({
      name: 'Bob Smith',
      jobTitle: 'Mechanic',
      summary: 'I fix cars.',
    });
    expect(data.email).toBe('');
    expect(data.phone).toBe('');
    expect(data.links).toEqual([]);
    expect(warnings).toContain('Email not found');
    expect(warnings).toContain('Phone not found');
    expect(warnings).toContain('No experience or projects found');
  });

  it('handles garbage input gracefully', () => {
    const { data, warnings } = normalizeCVOutput(null);
    expect(data.name).toBe('');
    expect(Object.keys(data).sort()).toEqual(
      [
        'name',
        'jobTitle',
        'email',
        'phone',
        'location',
        'links',
        'summary',
        'experience',
        'projects',
        'education',
        'skills',
        'certifications',
        'customSections',
      ].sort(),
    );
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('coerces numeric values to strings', () => {
    const { data } = normalizeCVOutput({ phone: 12345 });
    expect(data.phone).toBe('12345');
  });

  it('drops non-object array entries', () => {
    const { data } = normalizeCVOutput({
      experience: [
        { role: 'Dev', company: 'X', date: '2020', description: '' },
        'junk',
        null,
      ],
    });
    expect(data.experience).toHaveLength(1);
  });
});

describe('parseCVWithRepair', () => {
  beforeEach(() => {
    mockedGenerateText.mockReset();
  });

  it('returns normalized output on success', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    const result = await parseCVWithRepair({
      model: minimalModel,
      system: 'sys',
      resumeText: 'resume text',
    });
    expect(result.data.name).toBe('Jane Doe');
    expect(result.warnings).toEqual([]);
  });

  it('salvages fenced JSON without an extra model call', async () => {
    mockedGenerateText.mockRejectedValue(
      noObjectError('```json\n' + JSON.stringify(validResume) + '\n```'),
    );
    const result = await parseCVWithRepair({
      model: minimalModel,
      system: 'sys',
      resumeText: 'resume text',
    });
    expect(result.data.name).toBe('Jane Doe');
    expect(mockedGenerateText).toHaveBeenCalledTimes(1);
  });

  it('re-prompts the model with validation feedback after a failure', async () => {
    mockedGenerateText
      .mockRejectedValueOnce(noObjectError('not json at all'))
      .mockResolvedValueOnce({ output: validResume } as never);

    const result = await parseCVWithRepair({
      model: minimalModel,
      system: 'sys',
      resumeText: 'resume text',
    });
    expect(result.data.name).toBe('Jane Doe');
    expect(mockedGenerateText).toHaveBeenCalledTimes(2);

    const repairCall = mockedGenerateText.mock.calls[1][0];
    const userContent = repairCall.messages![0].content as Array<{
      text?: string;
    }>;
    expect(userContent[userContent.length - 1].text).toContain(
      'corrected JSON',
    );
  });

  it('throws a friendly error when repairs are exhausted', async () => {
    mockedGenerateText.mockRejectedValue(noObjectError('still not json'));

    await expect(
      parseCVWithRepair({
        model: minimalModel,
        system: 'sys',
        resumeText: 'resume text',
        maxRepairAttempts: 1,
      }),
    ).rejects.toThrow('Could not generate the requested output');
  });

  it('rethrows non-schema errors untouched', async () => {
    mockedGenerateText.mockRejectedValue(new Error('boom'));
    await expect(
      parseCVWithRepair({
        model: minimalModel,
        system: 'sys',
        resumeText: 'resume text',
      }),
    ).rejects.toThrow('boom');
  });
});

describe('adjustCVWithRepair', () => {
  beforeEach(() => {
    mockedGenerateText.mockReset();
  });

  const lastUserText = () => {
    const call = mockedGenerateText.mock.calls[0][0];
    const content = call.messages![0].content as Array<{ text?: string }>;
    return content[content.length - 1].text ?? '';
  };

  const firstUserContent = () => {
    const call = mockedGenerateText.mock.calls[0][0];
    return call.messages![0].content as Array<{
      type?: string;
      text?: string;
      image?: string;
      mediaType?: string;
    }>;
  };

  it('returns normalized output on success', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    const result = await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'Senior engineer role',
    });
    expect(result.data.name).toBe('Jane Doe');
    expect(result.warnings).toEqual([]);
  });

  it('builds a full-CV prompt by default', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'job',
    });
    expect(lastUserText()).toContain(
      'Rewrite the CV to match the job description',
    );
    expect(lastUserText()).not.toContain('Rewrite ONLY the');
  });

  it('builds a full-CV prompt for the full scope', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'job',
      scope: 'full',
    });
    expect(lastUserText()).not.toContain('Rewrite ONLY the');
  });

  it('injects a scope directive for a targeted section', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'job',
      scope: 'summary',
    });
    expect(lastUserText()).toContain('Rewrite ONLY the Summary section');
    expect(lastUserText()).toContain(
      'byte-for-byte identical to the source CV',
    );
    expect(lastUserText()).toContain('CV Data:');
    expect(lastUserText()).toContain('Job Description:');
  });

  it('uses the human-readable section title for scoped prompts', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'job',
      scope: 'experience',
    });
    expect(lastUserText()).toContain('Rewrite ONLY the Experience section');
  });

  it('merges a scoped result back into the source, preserving other fields', async () => {
    mockedGenerateText.mockResolvedValue({
      output: { name: 'Jane Doe', summary: 'New tailored summary' },
    } as never);
    const source = validResume as unknown as CVData;
    const result = await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: source,
      jobDescription: 'job',
      scope: 'summary',
    });
    expect(result.data.summary).toBe('New tailored summary');
    expect(result.data.email).toBe(source.email);
    expect(result.data.experience).toEqual(source.experience);
    expect(result.data.name).toBe(source.name);
    expect(result.warnings).toEqual([]);
  });

  it('keeps the source section when the model returns nothing for it', async () => {
    mockedGenerateText.mockResolvedValue({
      output: { name: 'Jane Doe', summary: '   ' },
    } as never);
    const source = validResume as unknown as CVData;
    const result = await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: source,
      jobDescription: 'job',
      scope: 'summary',
    });
    expect(result.data.summary).toBe(source.summary);
    expect(result.warnings).toEqual(['Could not adjust the Summary section.']);
  });

  it('keeps the source array section when the model empties it', async () => {
    mockedGenerateText.mockResolvedValue({
      output: { name: 'Jane Doe', experience: [] },
    } as never);
    const source = validResume as unknown as CVData;
    const result = await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: source,
      jobDescription: 'job',
      scope: 'experience',
    });
    expect(result.data.experience).toEqual(source.experience);
    expect(result.warnings).toEqual([
      'Could not adjust the Experience section.',
    ]);
  });

  it('sends job description images to the model alongside the text', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'Senior engineer role',
      imageParts: [{ data: 'BASE64DATA', mimeType: 'image/jpeg' }],
    });
    const content = firstUserContent();
    expect(content[0]).toEqual({
      type: 'image',
      image: 'BASE64DATA',
      mediaType: 'image/jpeg',
    });
    expect(content[content.length - 1].text).toContain('Senior engineer role');
  });

  it('marks the job description as image-provided when text is empty', async () => {
    mockedGenerateText.mockResolvedValue({ output: validResume } as never);
    await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: '   ',
      imageParts: [{ data: 'BASE64DATA', mimeType: 'image/png' }],
    });
    expect(firstUserContent()[0]).toEqual({
      type: 'image',
      image: 'BASE64DATA',
      mediaType: 'image/png',
    });
    expect(lastUserText()).toContain('(provided as image(s) above)');
  });

  it('re-includes the job description images on repair attempts', async () => {
    mockedGenerateText
      .mockRejectedValueOnce(noObjectError('not json at all'))
      .mockResolvedValueOnce({ output: validResume } as never);

    const result = await adjustCVWithRepair({
      model: minimalModel,
      system: 'sys',
      cvData: validResume as unknown as CVData,
      jobDescription: 'job',
      imageParts: [{ data: 'BASE64DATA', mimeType: 'image/webp' }],
    });
    expect(result.data.name).toBe('Jane Doe');
    expect(mockedGenerateText).toHaveBeenCalledTimes(2);

    const repairContent = mockedGenerateText.mock.calls[1][0].messages![0]
      .content as Array<{ type?: string; image?: string }>;
    expect(repairContent[0]).toEqual({
      type: 'image',
      image: 'BASE64DATA',
      mediaType: 'image/webp',
    });
  });

  it('disables transient retries and caps repairs when images are attached', async () => {
    mockedGenerateText.mockRejectedValue(noObjectError('bad json'));
    await expect(
      adjustCVWithRepair({
        model: minimalModel,
        system: 'sys',
        cvData: validResume as unknown as CVData,
        jobDescription: 'job',
        imageParts: [{ data: 'BASE64DATA', mimeType: 'image/jpeg' }],
      }),
    ).rejects.toThrow('Could not generate the requested output');
    expect(mockedGenerateText).toHaveBeenCalledTimes(2);
    expect(mockedGenerateText.mock.calls[0][0].maxRetries).toBe(0);
    expect(mockedGenerateText.mock.calls[1][0].maxRetries).toBe(0);
  });
});
