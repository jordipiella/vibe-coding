#!/usr/bin/env node

import process from 'node:process';

const marker = '<!-- pr-review-gate -->';
const prHeadSha = process.env.PR_HEAD_SHA?.trim();
const rawComments = process.env.PR_REVIEW_COMMENTS_JSON ?? '[]';

if (!prHeadSha) {
  console.error('Missing PR_HEAD_SHA.');
  process.exit(1);
}

let comments;

try {
  comments = JSON.parse(rawComments);
} catch (error) {
  console.error('Could not parse PR_REVIEW_COMMENTS_JSON.');
  console.error(error);
  process.exit(1);
}

function stripHtmlComments(value) {
  return value.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function getSection(body, title) {
  const normalizedBody = body.replace(/\r\n/g, '\n');
  const heading = `### ${title}`;
  const headingIndex = normalizedBody.indexOf(heading);

  if (headingIndex === -1) {
    return '';
  }

  const afterHeading = normalizedBody.slice(headingIndex + heading.length).replace(/^\s*\n/, '');
  const nextHeadingIndex = afterHeading.search(/\n(?=###\s|##\s)/);

  if (nextHeadingIndex === -1) {
    return afterHeading.trim();
  }

  return afterHeading.slice(0, nextHeadingIndex).trim();
}

function isValidReviewComment(comment) {
  const body = String(comment?.body ?? '').replace(/\r\n/g, '\n');

  if (!body.includes(marker)) {
    return false;
  }

  const shaMatch = body.match(/^Head SHA:\s*([0-9a-f]{7,40})\s*$/im);

  if (!shaMatch || shaMatch[1] !== prHeadSha) {
    return false;
  }

  const findings = stripHtmlComments(getSection(body, 'Findings'));
  const summary = stripHtmlComments(getSection(body, 'Summary'));

  return findings.length > 0 && summary.length > 0;
}

const matchingComment = comments.filter(isValidReviewComment).at(-1);

if (matchingComment) {
  const commentId = matchingComment.id ?? 'unknown';
  console.log(`PR review gate satisfied by comment #${commentId} for ${prHeadSha}.`);
  process.exit(0);
}

console.error(`Missing PR review comment for head SHA ${prHeadSha}.`);
console.error('Run `$github-pr-review` on the latest PR diff and post a top-level comment like this:');
console.error('');
console.error(marker);
console.error('## PR Review');
console.error(`Head SHA: ${prHeadSha}`);
console.error('');
console.error('### Findings');
console.error('- None.');
console.error('');
console.error('### Summary');
console.error('- Reviewed with `$github-pr-review` on the current head.');
process.exit(1);
