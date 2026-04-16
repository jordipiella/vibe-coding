#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const AUTO_REVIEW_MARKER = '<!-- auto-pr-review -->';
const GATE_MARKER = '<!-- pr-review-gate -->';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const GITHUB_MODELS_URL = 'https://models.github.ai/inference/chat/completions';
const MAX_FINDINGS = 8;
const PROMPT_VARIANTS = {
  standard: {
    maxPromptChars: 14000,
    maxPatchCharsPerFile: 1400,
    maxFilesWithPatch: 8,
    maxChangedFilesList: 15,
    maxAgentsChars: 1800,
    maxStackChars: 1200,
    maxTokens: 1200,
  },
  compact: {
    maxPromptChars: 7000,
    maxPatchCharsPerFile: 700,
    maxFilesWithPatch: 4,
    maxChangedFilesList: 8,
    maxAgentsChars: 900,
    maxStackChars: 600,
    maxTokens: 800,
  },
};

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

function getFileChangeScore(file) {
  return (file.patch ? 100000 : 0) + (file.additions ?? 0) + (file.deletions ?? 0);
}

function buildDiffContext(files, variant) {
  const selectedFiles = [...files]
    .sort((left, right) => getFileChangeScore(right) - getFileChangeScore(left))
    .slice(0, variant.maxFilesWithPatch);
  let remaining = variant.maxPromptChars;
  const sections = [];

  for (const file of selectedFiles) {
    const patch = file.patch ? truncate(file.patch, variant.maxPatchCharsPerFile) : '[diff omitted by GitHub]';
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

  const omittedFiles = Math.max(files.length - selectedFiles.length, 0);

  if (omittedFiles > 0) {
    sections.push(`Additional changed files omitted from diff excerpt: ${omittedFiles}`);
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

function extractGithubModelsText(payload) {
  const text = payload?.choices?.[0]?.message?.content;

  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('GitHub Models response did not include assistant text.');
  }

  return text.trim();
}

async function requestReviewFromModel(prompt, maxTokens) {
  const token = getRequiredEnv('GITHUB_TOKEN');
  const model = process.env.GITHUB_MODELS_PR_REVIEW_MODEL?.trim() || DEFAULT_MODEL;

  const response = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: [
            'You are an automated senior code reviewer for a pnpm monorepo with Vue 3, Fastify, TypeScript, Zod, Vitest, and Playwright.',
            'Review the PR for correctness first, then regressions, contract drift, missing tests, and stale docs.',
            'Return only valid JSON with this shape:',
            '{"summary":["..."],"findings":[{"severity":"high|medium|low","title":"...","file":"optional path","details":"...","recommendation":"..."}]}',
            `Limit findings to at most ${MAX_FINDINGS}.`,
            'If there are no actionable findings, return an empty findings array.',
            'Do not praise, do not mention style nitpicks, and do not invent files not present in the PR.',
          ].join(' '),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const apiError = parseOpenAiError(errorText);
    const error = new Error(`GitHub Models API failed: ${response.status} ${errorText}`);
    error.name = 'GitHubModelsReviewError';
    error.status = response.status;
    error.providerError = apiError;
    throw error;
  }

  const payload = await response.json();
  return parseModelJson(extractGithubModelsText(payload));
}

function buildPrompt({ pr, files, agentsContext, stackProfileContext, variant }) {
  const changedFiles = files
    .slice(0, variant.maxChangedFilesList)
    .map((file) => `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`)
    .join('\n');
  const omittedChangedFiles = Math.max(files.length - variant.maxChangedFilesList, 0);
  const changedFilesSection = omittedChangedFiles > 0
    ? `${changedFiles}\n- ...and ${omittedChangedFiles} more changed files`
    : changedFiles;

  return [
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
    changedFilesSection || '[no changed files listed]',
    '',
    'Diff excerpts:',
    buildDiffContext(files, variant),
    '',
    'Repository review context from AGENTS.md:',
    truncate(agentsContext || '[not available]', variant.maxAgentsChars),
    '',
    'Repository stack profile:',
    truncate(stackProfileContext || '[not available]', variant.maxStackChars),
  ].join('\n');
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
  const providerError = error?.providerError;
  const isQuotaError = providerError?.code === 'insufficient_quota';
  const headline = isQuotaError
    ? 'GitHub Models free quota is currently exhausted for this repository or account.'
    : 'Automated PR review could not be completed.';
  const details = providerError?.message || error.message || 'Unknown error.';
  const followUp = isQuotaError
    ? '- Repo maintainer: wait for quota to reset or enable paid GitHub Models usage, then rerun this workflow or push a new commit.'
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

  try {
    const standardPrompt = buildPrompt({
      pr,
      files,
      agentsContext,
      stackProfileContext,
      variant: PROMPT_VARIANTS.standard,
    });
    let rawReview;

    try {
      rawReview = await requestReviewFromModel(standardPrompt, PROMPT_VARIANTS.standard.maxTokens);
    } catch (error) {
      if (error?.name !== 'GitHubModelsReviewError' || error?.providerError?.code !== 'tokens_limit_reached') {
        throw error;
      }

      const compactPrompt = buildPrompt({
        pr,
        files,
        agentsContext,
        stackProfileContext,
        variant: PROMPT_VARIANTS.compact,
      });

      rawReview = await requestReviewFromModel(compactPrompt, PROMPT_VARIANTS.compact.maxTokens);
    }

    const review = normalizeReview(rawReview);
    const commentBody = buildComment({
      headSha: pr.head.sha,
      review,
    });

    await upsertComment(prNumber, commentBody, comments);
    console.log(`Automated PR review published for PR #${prNumber}.`);
  } catch (error) {
    if (error?.name !== 'GitHubModelsReviewError') {
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
