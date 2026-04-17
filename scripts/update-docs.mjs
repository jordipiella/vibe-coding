#!/usr/bin/env node

import process from 'node:process';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const GITHUB_MODELS_URL = 'https://models.github.ai/inference/chat/completions';
const DOCS_DIR = 'apps/docs/docs';
const WATCHED_PATHS = ['apps/api/src', 'apps/web/src', 'packages/contracts/src'];

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function truncate(value, maxChars) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n...[truncated]`;
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
      'User-Agent': 'vibe-coding-update-docs',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

async function getCommitDiff(beforeSha, afterSha) {
  const comparison = await githubRequest(`/compare/${beforeSha}...${afterSha}`);

  const relevantFiles = comparison.files.filter((file) =>
    WATCHED_PATHS.some((path) => file.filename.startsWith(path)),
  );

  return relevantFiles
    .map((file) => [
      `File: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`,
      file.patch ? truncate(file.patch, 1500) : '[diff omitted]',
    ].join('\n'))
    .join('\n\n');
}

async function getCurrentDocs() {
  const repository = getRequiredEnv('GITHUB_REPOSITORY');
  const apiUrl = process.env.GITHUB_API_URL?.trim() ?? 'https://api.github.com';
  const token = getRequiredEnv('GITHUB_TOKEN');

  const response = await fetch(`${apiUrl}/repos/${repository}/contents/${DOCS_DIR}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vibe-coding-update-docs',
    },
  });

  if (!response.ok) return [];

  const files = await response.json();
  const docs = [];

  for (const file of files.filter((f) => f.name.endsWith('.md'))) {
    const fileResponse = await fetch(file.download_url);
    const content = await fileResponse.text();
    docs.push({ path: file.path, content: truncate(content, 2000) });
  }

  return docs;
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

async function requestDocsUpdateFromModel(diff, docs) {
  const token = getRequiredEnv('GITHUB_TOKEN');
  const model = process.env.GITHUB_MODELS_PR_REVIEW_MODEL?.trim() || DEFAULT_MODEL;

  const docsContext = docs
    .map((doc) => `### ${doc.path}\n${doc.content}`)
    .join('\n\n');

  const prompt = [
    'The following changes were merged to master:',
    '',
    diff,
    '',
    'Current documentation:',
    '',
    docsContext,
  ].join('\n');

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
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a documentation agent for a pnpm monorepo with Vue 3, Fastify, TypeScript, and Zod.',
            'Given a code diff and the current documentation, determine which docs need updating and generate the updated content.',
            'Only update docs if the diff clearly changes behavior, routes, contracts, setup, or environment variables.',
            'Do not invent information not present in the diff.',
            'Return valid JSON with this shape:',
            '{"pr_title":"...","pr_summary":"...","updates":[{"file":"apps/docs/docs/filename.md","content":"full updated markdown content"}]}',
            'If no documentation update is needed, return an empty updates array.',
            'Keep documentation concise and focused. Do not add sections that are not already in the docs unless the diff clearly introduces new concepts.',
          ].join(' '),
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub Models API failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;

  if (!text?.trim()) {
    throw new Error('GitHub Models response did not include text.');
  }

  return parseModelJson(text);
}

async function createDocsPR(result, headSha) {
  const branchName = `docs/auto-update-${headSha.slice(0, 7)}`;
  const repository = getRequiredEnv('GITHUB_REPOSITORY');

  // Create branch from master (delete first if it already exists)
  try {
    await githubRequest(`/git/refs/heads/${branchName}`, { method: 'DELETE' });
  } catch {
    // Branch didn't exist, that's fine
  }

  await githubRequest('/git/refs', {
    method: 'POST',
    body: { ref: `refs/heads/${branchName}`, sha: headSha },
  });

  // Commit each updated file
  for (const update of result.updates) {
    let existingSha;

    try {
      const existing = await githubRequest(`/contents/${update.file}`);
      existingSha = existing.sha;
    } catch {
      existingSha = undefined;
    }

    await githubRequest(`/contents/${update.file}`, {
      method: 'PUT',
      body: {
        message: `docs: update ${update.file.split('/').pop()}`,
        content: Buffer.from(update.content).toString('base64'),
        branch: branchName,
        ...(existingSha ? { sha: existingSha } : {}),
      },
    });
  }

  // Open PR
  const pr = await githubRequest('/pulls', {
    method: 'POST',
    body: {
      title: result.pr_title || 'docs: automated documentation update',
      body: [
        '## Automated documentation update',
        '',
        result.pr_summary || 'Documentation updated to reflect recent code changes.',
        '',
        '> Generated automatically by the docs update agent. Review and merge if accurate.',
      ].join('\n'),
      head: branchName,
      base: 'master',
    },
  });

  return pr;
}

async function main() {
  const beforeSha = getRequiredEnv('BEFORE_SHA');
  const afterSha = getRequiredEnv('AFTER_SHA');

  console.log(`Comparing ${beforeSha}...${afterSha}`);

  const diff = await getCommitDiff(beforeSha, afterSha);

  if (!diff) {
    console.log('No relevant file changes detected. Skipping docs update.');
    return;
  }

  console.log('Relevant changes detected. Fetching current docs...');
  const docs = await getCurrentDocs();

  console.log('Requesting docs update from model...');
  const result = await requestDocsUpdateFromModel(diff, docs);

  if (!result.updates?.length) {
    console.log('Model determined no documentation update is needed.');
    return;
  }

  console.log(`Creating PR with ${result.updates.length} doc update(s)...`);
  const pr = await createDocsPR(result, afterSha);

  console.log(`Docs PR created: ${pr.html_url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
