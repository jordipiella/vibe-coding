#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const AUTO_REVIEW_MARKER = '<!-- auto-pr-review -->';
const GATE_MARKER = '<!-- pr-review-gate -->';
const DEFAULT_MODEL = 'gpt-5-mini';
const MAX_PROMPT_CHARS = 30000;
const MAX_PATCH_CHARS_PER_FILE = 3500;
const MAX_FINDINGS = 8;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function truncate(value, maxChars) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}\n...[truncated]`;
}

async function readOptionalFile(path, maxChars) {
  try {
    const content = await readFile(path, 'utf8');
    return truncate(content, maxChars);
  } catch {
    return '';
  }
}

async function githubRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const repository = getRequiredEnv('GITHUB_REPOSITORY');
  const apiUrl = process.env.GITHUB_API_URL?.trim() ?? 'https://api.github.com';
  const token = getRequiredEnv('GITHUB_TOKEN');

  const response = await fetch(`${apiUrl}/repos/${repository}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vibe-coding-automated-pr-review',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function githubPaginate(path) {
  const items = [];
  let page = 1;

  while (true) {
    const pageItems = await githubRequest(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);

    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      return items;
    }

    items.push(...pageItems);

    if (pageItems.length < 100) {
      return items;
    }

    page += 1;
  }
}

function buildDiffContext(files) {
  let remaining = MAX_PROMPT_CHARS;
  const sections = [];

  for (const file of files) {
    const patch = file.patch ? truncate(file.patch, MAX_PATCH_CHARS_PER_FILE) : '[diff omitted by GitHub]';
    const section = [
      `File: ${file.filename}`,
      `Status: ${file.status}`,
      `Changes: +${file.additions} / -${file.deletions}`,
      'Patch:',
      patch,
    ].join('\n');

    if (section.length > remaining) {
      break;
    }

    sections.push(section);
    remaining -= section.length + 2;
  }

  return sections.join('\n\n');
}

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const texts = [];

  for (const outputItem of payload.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.type === 'output_text' && typeof contentItem.text === 'string') {
        texts.push(contentItem.text);
      }
    }
  }

  const combined = texts.join('\n').trim();

  if (!combined) {
    throw new Error('OpenAI response did not include output text.');
  }

  return combined;
}

function parseModelJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Model response is not valid JSON.');
    }

    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }
}

function parseOpenAiError(errorText) {
  try {
    const payload = JSON.parse(errorText);
    return payload?.error ?? null;
  } catch {
    return null;
  }
}

function getReviewMode() {
  return (process.env.OPENAI_PR_REVIEW_MODE?.trim().toLowerCase() || 'live');
}

async function requestReviewFromModel(prompt) {
  const apiKey = getRequiredEnv('OPENAI_API_KEY');
  const model = process.env.OPENAI_PR_REVIEW_MODEL?.trim() || DEFAULT_MODEL;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 2200,
      text: {
        format: {
          type: 'json_object',
        },
      },
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'You are an automated senior code reviewer for a pnpm monorepo with Vue 3, Fastify, TypeScript, Zod, Vitest, and Playwright.',
                'Review the PR for correctness first, then regressions, contract drift, missing tests, and stale docs.',
                'Return only valid JSON with this shape:',
                '{"summary":["..."],"findings":[{"severity":"high|medium|low","title":"...","file":"optional path","details":"...","recommendation":"..."}]}',
                `Limit findings to at most ${MAX_FINDINGS}.`,
                'If there are no actionable findings, return an empty findings array.',
                'Do not praise, do not mention style nitpicks, and do not invent files not present in the PR.',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const apiError = parseOpenAiError(errorText);
    const error = new Error(`OpenAI API failed: ${response.status} ${errorText}`);
    error.name = 'OpenAIReviewError';
    error.status = response.status;
    error.openaiError = apiError;
    throw error;
  }

  const payload = await response.json();
  return parseModelJson(extractResponseText(payload));
}

function buildMockReview(files) {
  const sampleFile = files[0]?.filename ?? '';

  return {
    findings: [
      {
        severity: 'low',
        title: 'Mock automated review is enabled',
        file: sampleFile,
        details:
          'This is a synthetic finding generated to validate the PR review loop without calling OpenAI. Treat it as a process test, not as a real code issue.',
        recommendation:
          'Reply to this comment as if it were a human review, then push a follow-up commit to validate the end-to-end workflow.',
      },
    ],
    summary: [
      'The repository is running in `OPENAI_PR_REVIEW_MODE=mock`, so this review comment is intentionally synthetic.',
      'Use this mode to validate comment publishing, author replies, reruns on new commits, and PR gate behavior before enabling the live model.',
    ],
  };
}

function normalizeReview(review) {
  const findings = Array.isArray(review.findings) ? review.findings : [];
  const summary = Array.isArray(review.summary) ? review.summary : [];

  return {
    findings: findings
      .slice(0, MAX_FINDINGS)
      .map((finding) => ({
        severity: typeof finding.severity === 'string' ? finding.severity.toLowerCase() : 'medium',
        title: String(finding.title ?? 'Untitled finding').trim(),
        file: typeof finding.file === 'string' ? finding.file.trim() : '',
        details: String(finding.details ?? '').trim(),
        recommendation: String(finding.recommendation ?? '').trim(),
      }))
      .filter((finding) => finding.title && finding.details),
    summary: summary.map((item) => String(item).trim()).filter(Boolean).slice(0, 5),
  };
}

function formatFindings(findings) {
  if (findings.length === 0) {
    return '- No actionable findings.';
  }

  return findings
    .map((finding, index) => {
      const prefix = `${index + 1}. [${finding.severity}] ${finding.title}`;
      const fileLine = finding.file ? `File: \`${finding.file}\`` : 'File: n/a';
      const recommendation = finding.recommendation
        ? `Recommendation: ${finding.recommendation}`
        : 'Recommendation: Review manually.';

      return [prefix, fileLine, finding.details, recommendation].join('\n');
    })
    .join('\n\n');
}

function formatSummary(summary) {
  if (summary.length === 0) {
    return '- Reviewed the PR diff and did not find additional actionable issues beyond the current findings list.';
  }

  return summary.map((item) => `- ${item}`).join('\n');
}

function buildComment({ headSha, review }) {
  return [
    AUTO_REVIEW_MARKER,
    GATE_MARKER,
    '## Automated PR Review',
    `Head SHA: ${headSha}`,
    '',
    '### Findings',
    formatFindings(review.findings),
    '',
    '### Summary',
    formatSummary(review.summary),
    '',
    '### Follow-up',
    '- PR owner: reply in the PR conversation explaining which findings you will address, dismiss, or defer.',
  ].join('\n');
}

function buildFailureComment({ headSha, error }) {
  const openaiError = error?.openaiError;
  const isQuotaError = openaiError?.code === 'insufficient_quota';
  const headline = isQuotaError
    ? 'OpenAI quota exhausted for the configured `OPENAI_API_KEY`.'
    : 'Automated PR review could not be completed.';
  const details = openaiError?.message || error.message || 'Unknown error.';
  const followUp = isQuotaError
    ? '- Repo maintainer: add quota or billing to the OpenAI project, then rerun this workflow or push a new commit.'
    : '- Repo maintainer: inspect the `Automated PR Review` workflow logs, fix the integration issue, and rerun the workflow.';

  return [
    AUTO_REVIEW_MARKER,
    '## Automated PR Review',
    `Head SHA: ${headSha}`,
    '',
    '### Status',
    `- ${headline}`,
    '',
    '### Findings',
    '- Review not generated because the automation failed before producing findings.',
    '',
    '### Summary',
    `- ${details}`,
    '',
    '### Follow-up',
    followUp,
  ].join('\n');
}

async function upsertComment(prNumber, body, comments) {
  const existingComment = comments
    .filter((comment) => String(comment.body ?? '').includes(AUTO_REVIEW_MARKER))
    .sort((left, right) => new Date(left.updated_at).getTime() - new Date(right.updated_at).getTime())
    .at(-1);

  if (existingComment) {
    return githubRequest(`/issues/comments/${existingComment.id}`, {
      method: 'PATCH',
      body: {
        body,
      },
    });
  }

  return githubRequest(`/issues/${prNumber}/comments`, {
    method: 'POST',
    body: {
      body,
    },
  });
}

async function main() {
  const prNumber = Number(getRequiredEnv('PR_NUMBER'));
  const pr = await githubRequest(`/pulls/${prNumber}`);
  const files = await githubPaginate(`/pulls/${prNumber}/files`);
  const comments = await githubPaginate(`/issues/${prNumber}/comments`);
  const agentsContext = await readOptionalFile('AGENTS.md', 5000);
  const stackProfileContext = await readOptionalFile('docs/stack-profile.md', 5000);

  const prompt = [
    `Repository: ${getRequiredEnv('GITHUB_REPOSITORY')}`,
    `PR #${pr.number}: ${pr.title}`,
    `Head SHA: ${pr.head.sha}`,
    `Base branch: ${pr.base.ref}`,
    `Head branch: ${pr.head.ref}`,
    '',
    'PR body:',
    pr.body?.trim() || '[empty]',
    '',
    'Changed files:',
    files
      .map((file) => `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`)
      .join('\n'),
    '',
    'Diff excerpts:',
    buildDiffContext(files),
    '',
    'Repository review context from AGENTS.md:',
    agentsContext || '[not available]',
    '',
    'Repository stack profile:',
    stackProfileContext || '[not available]',
  ].join('\n');

  try {
    const rawReview = getReviewMode() === 'mock'
      ? buildMockReview(files)
      : await requestReviewFromModel(prompt);
    const review = normalizeReview(rawReview);
    const commentBody = buildComment({
      headSha: pr.head.sha,
      review,
    });

    await upsertComment(prNumber, commentBody, comments);
    console.log(`Automated PR review published for PR #${prNumber}.`);
  } catch (error) {
    if (error?.name !== 'OpenAIReviewError') {
      throw error;
    }

    const failureComment = buildFailureComment({
      headSha: pr.head.sha,
      error,
    });

    await upsertComment(prNumber, failureComment, comments);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
