#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  model: 'claude-haiku-4-5-20251001',
  sections: 'Usage,Installation,Features,API',
  auto_commit: 'false',
  max_diff_chars: '2000',
};

function loadConfig(cwd = process.cwd()) {
  const cfg = { ...DEFAULT_CONFIG };
  const cfgPath = join(cwd, '.living-readme');
  if (existsSync(cfgPath)) {
    const lines = readFileSync(cfgPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length) cfg[key.trim()] = rest.join('=').trim();
    }
  }
  return cfg;
}

// ─── Git helpers ─────────────────────────────────────────────────────────────

function gitRoot(cwd = process.cwd()) {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function getChangedFiles(cwd = process.cwd()) {
  try {
    const out = execSync('git diff HEAD~1 HEAD --name-only', { cwd, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    // First commit — diff against empty tree
    try {
      const out = execSync('git diff --cached --name-only', { cwd, encoding: 'utf8' });
      return out.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

function getDiff(files, cwd = process.cwd(), maxChars = 2000) {
  let diff = '';
  for (const file of files.slice(0, 10)) {
    try {
      const fileDiff = execSync(
        `git diff HEAD~1 HEAD -- "${file.replace(/"/g, '\\"')}"`,
        { cwd, encoding: 'utf8' }
      );
      diff += fileDiff;
      if (diff.length > maxChars) break;
    } catch {
      // File may be new — try show
      try {
        const fileDiff = execSync(
          `git show HEAD -- "${file.replace(/"/g, '\\"')}"`,
          { cwd, encoding: 'utf8' }
        );
        diff += fileDiff;
        if (diff.length > maxChars) break;
      } catch { /* skip */ }
    }
  }
  return diff.slice(0, maxChars);
}

function getLastCommitTimestamp(cwd = process.cwd()) {
  try {
    return parseInt(
      execSync('git log -1 --format=%ct', { cwd, encoding: 'utf8' }).trim(),
      10
    );
  } catch {
    return 0;
  }
}

// ─── Section detection ───────────────────────────────────────────────────────

const SECTION_RULES = [
  { pattern: /src\/api|routes?\//i,                  sections: ['API', 'Usage'] },
  { pattern: /package\.json|package-lock|yarn\.lock|pnpm-lock/i, sections: ['Installation'] },
  { pattern: /\.test\.|\.spec\.|__tests__|\/test\//i, sections: ['Testing'] },
  { pattern: /README|CHANGELOG|CONTRIBUTING/i,        sections: [] },
  { pattern: /src\/|lib\/|index\./i,                  sections: ['Usage', 'Features'] },
  { pattern: /docker|compose|kubernetes|k8s/i,        sections: ['Installation', 'Usage'] },
  { pattern: /\.env|config\./i,                       sections: ['Installation', 'Configuration'] },
];

function detectRelevantSections(changedFiles, configuredSections) {
  const configured = configuredSections.split(',').map(s => s.trim());
  const detected = new Set();

  for (const file of changedFiles) {
    for (const rule of SECTION_RULES) {
      if (rule.pattern.test(file)) {
        rule.sections.forEach(s => detected.add(s));
      }
    }
  }

  const relevant = [...detected].filter(s => configured.includes(s));

  if (relevant.length === 0) {
    return configured.filter(s => ['Usage', 'Features'].includes(s)).slice(0, 2);
  }

  return relevant;
}

// ─── README section parsing ───────────────────────────────────────────────────

function getSectionNames(content) {
  const matches = content.match(/^#{1,3}\s+(.+)$/gm) || [];
  return matches.map(m => m.replace(/^#{1,3}\s+/, '').trim());
}

// ─── Claude API ──────────────────────────────────────────────────────────────

function callClaude(prompt, model, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`Claude API error: ${parsed.error.message}`));
          } else {
            resolve(parsed.content?.[0]?.text || '');
          }
        } catch (e) {
          reject(new Error(`Failed to parse Claude response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Claude API request timed out'));
    });

    req.write(body);
    req.end();
  });
}

function buildPrompt(readmeContent, diff, sectionNames, extraMessage) {
  const sectionList = sectionNames.join(', ');
  let prompt = `Here is my current README.md:

\`\`\`markdown
${readmeContent}
\`\`\`

Here is what just changed in my code (git diff):

\`\`\`diff
${diff}
\`\`\`

Please update ONLY the relevant section(s) (${sectionList}) of this README to accurately reflect these code changes. Rules:
- Keep all other sections EXACTLY as they are — do not change a single word
- Only update content that is directly affected by the diff shown
- Do not add new sections unless the changes clearly introduce a new major feature
- Do not remove existing sections
- Return the COMPLETE updated README (all sections, updated and unchanged)
- Do not wrap the response in code fences — just return the raw markdown`;

  if (extraMessage) {
    prompt += `\n\nAdditional context from the developer: ${extraMessage}`;
  }

  return prompt;
}

// ─── Core update logic ────────────────────────────────────────────────────────

async function updateReadme(cwd, options = {}) {
  const root = gitRoot(cwd);
  if (!root) {
    console.error('living-readme: not a git repository');
    process.exit(1);
  }

  const readmePath = join(root, 'README.md');
  if (!existsSync(readmePath)) {
    if (!options.silent) console.log('living-readme: no README.md found — skipping');
    return;
  }

  const cfg = loadConfig(root);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Infinite loop guard: skip if a commit happened in the last 5 seconds.
  // When the hook runs, it stages README.md but does NOT commit — so there's
  // no loop. However, if auto_commit=true were ever added, this guard prevents
  // the amend/commit from re-triggering the hook.
  const lastCommit = getLastCommitTimestamp(root);
  const now = Math.floor(Date.now() / 1000);
  if (!options.force && now - lastCommit < 5) {
    if (!options.silent) console.log('living-readme: skipping (commit too recent — loop guard active)');
    return;
  }

  const changedFiles = options.files || getChangedFiles(root);
  if (changedFiles.length === 0) {
    if (!options.silent) console.log('living-readme: no changed files detected');
    return;
  }

  const readmeContent = readFileSync(readmePath, 'utf8');
  const existingSections = getSectionNames(readmeContent);
  const relevantSections = detectRelevantSections(changedFiles, cfg.sections);

  // Only target sections that actually exist in the README
  const targetSections = relevantSections.filter(s =>
    existingSections.some(es => es.toLowerCase().includes(s.toLowerCase()))
  );

  if (!options.silent) {
    console.log(`living-readme: changed files → ${changedFiles.join(', ')}`);
    console.log(`living-readme: target sections → ${targetSections.join(', ') || '(none matched)'}`);
  }

  if (targetSections.length === 0) {
    if (!options.silent) console.log('living-readme: no matching README sections — skipping');
    return;
  }

  if (!apiKey) {
    console.log('living-readme: ANTHROPIC_API_KEY not set — skipping AI update');
    console.log(`living-readme: would update sections: ${targetSections.join(', ')}`);
    return;
  }

  const diff = options.diff || getDiff(changedFiles, root, parseInt(cfg.max_diff_chars, 10));
  if (!diff.trim()) {
    if (!options.silent) console.log('living-readme: empty diff — skipping');
    return;
  }

  const prompt = buildPrompt(readmeContent, diff, targetSections, options.message);

  try {
    if (!options.silent) console.log(`living-readme: calling ${cfg.model}...`);
    const updated = await callClaude(prompt, cfg.model, apiKey);

    if (!updated || updated.trim() === readmeContent.trim()) {
      if (!options.silent) console.log('living-readme: README already up to date');
      return;
    }

    writeFileSync(readmePath, updated, 'utf8');
    if (!options.silent) console.log('living-readme: README.md updated');

    // Stage the updated README.
    // We do NOT --amend the commit — that would re-trigger the post-commit hook
    // and create an infinite loop. Instead, README.md is staged and will be
    // included in the developer's NEXT commit (or they can amend manually).
    execSync('git add README.md', { cwd: root });
    if (!options.silent) {
      console.log('living-readme: README.md staged for next commit');
      console.log('  (run `git commit --amend --no-edit` to fold it into this commit)');
    }
  } catch (err) {
    console.warn(`living-readme: AI update failed — ${err.message}`);
    console.warn('living-readme: your commit was not affected');
  }
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function install(cwd = process.cwd()) {
  const root = gitRoot(cwd);
  if (!root) {
    console.error('Error: not a git repository');
    process.exit(1);
  }

  const hooksDir = join(root, '.git', 'hooks');
  if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });

  const hookPath = join(hooksDir, 'post-commit');
  const indexPath = resolve(__dirname, 'index.js');

  const hookContent = `#!/bin/sh
# living-readme post-commit hook
# Installed by: npx living-readme install
# Remove with:  npx living-readme uninstall

node "${indexPath}" hook
`;

  writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log('living-readme: post-commit hook installed');
  console.log(`Hook path: ${hookPath}`);
  console.log('');
  console.log('Set your API key to enable AI updates:');
  console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
  console.log('');
  console.log('Optional: create .living-readme in your repo root to configure:');
  console.log('  model=claude-haiku-4-5-20251001');
  console.log('  sections=Usage,Installation,Features,API');
  console.log('  max_diff_chars=2000');
}

function uninstall(cwd = process.cwd()) {
  const root = gitRoot(cwd);
  if (!root) {
    console.error('Error: not a git repository');
    process.exit(1);
  }

  const hookPath = join(root, '.git', 'hooks', 'post-commit');
  if (!existsSync(hookPath)) {
    console.log('living-readme: no post-commit hook found');
    return;
  }

  const content = readFileSync(hookPath, 'utf8');
  if (!content.includes('living-readme')) {
    console.log('living-readme: post-commit hook was not installed by living-readme — skipping');
    return;
  }

  unlinkSync(hookPath);
  console.log('living-readme: post-commit hook removed');
}

function status(cwd = process.cwd()) {
  const root = gitRoot(cwd);
  if (!root) {
    console.error('Error: not a git repository');
    process.exit(1);
  }

  const hookPath = join(root, '.git', 'hooks', 'post-commit');
  const hookInstalled = existsSync(hookPath) &&
    readFileSync(hookPath, 'utf8').includes('living-readme');

  const readmePath = join(root, 'README.md');
  const readmeExists = existsSync(readmePath);

  const cfg = loadConfig(root);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const cfgPath = join(root, '.living-readme');

  console.log('living-readme status');
  console.log('─'.repeat(40));
  console.log(`Hook installed:   ${hookInstalled ? 'yes' : 'no (run: living-readme install)'}`);
  console.log(`README.md found:  ${readmeExists ? 'yes' : 'no'}`);
  console.log(`API key set:      ${apiKey ? 'yes' : 'no (set ANTHROPIC_API_KEY)'}`);
  console.log(`Config file:      ${existsSync(cfgPath) ? cfgPath : '(using defaults)'}`);
  console.log(`Model:            ${cfg.model}`);
  console.log(`Watch sections:   ${cfg.sections}`);
  console.log(`Max diff chars:   ${cfg.max_diff_chars}`);

  if (readmeExists) {
    const content = readFileSync(readmePath, 'utf8');
    const sections = getSectionNames(content);
    console.log(`README sections:  ${sections.join(', ') || '(none found)'}`);
  }

  const changedFiles = getChangedFiles(root);
  if (changedFiles.length > 0) {
    const relevant = detectRelevantSections(changedFiles, cfg.sections);
    console.log('');
    console.log(`Recent changed:   ${changedFiles.join(', ')}`);
    console.log(`Would update:     ${relevant.join(', ') || '(none matched)'}`);
  }
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

const [,, command, ...args] = process.argv;

switch (command) {
  case 'install':
    install();
    break;

  case 'uninstall':
    uninstall();
    break;

  case 'status':
    status();
    break;

  case 'hook':
    // Called automatically by git post-commit hook
    updateReadme(process.cwd(), { silent: false }).catch(err => {
      console.warn(`living-readme: unexpected error — ${err.message}`);
    });
    break;

  case 'update': {
    const msgIdx = args.indexOf('--message');
    const message = msgIdx !== -1 ? args[msgIdx + 1] : null;
    const forceFlag = args.includes('--force');
    updateReadme(process.cwd(), {
      silent: false,
      force: forceFlag,
      message,
    }).catch(err => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
    break;
  }

  case undefined:
  case '--help':
  case 'help':
    console.log(`
living-readme — README that updates itself on every commit

COMMANDS
  install              Install git post-commit hook in current repo
  uninstall            Remove the post-commit hook
  update               Manually trigger README update
    --message "text"   Add context about what changed
    --force            Skip the loop-guard timestamp check
  status               Show hook status and what would be updated

SETUP
  1. npm install -g living-readme   (or: npx living-readme install)
  2. cd your-project
  3. living-readme install
  4. export ANTHROPIC_API_KEY=sk-ant-...

CONFIG FILE  (.living-readme in repo root)
  model=claude-haiku-4-5-20251001
  sections=Usage,Installation,Features,API
  max_diff_chars=2000

SECTION MATCHING RULES
  src/api*, routes/       → API, Usage
  package.json            → Installation
  *.test.*, __tests__/    → Testing
  src/, lib/, index.*     → Usage, Features
  docker*, kubernetes/    → Installation, Usage
  .env, config.*          → Installation, Configuration

HOW IT WORKS
  1. You commit code normally
  2. post-commit hook fires automatically
  3. living-readme reads what changed (git diff)
  4. Determines which README sections are relevant
  5. Sends diff + README to Claude Haiku
  6. README.md updated and staged for next commit

LOOP PREVENTION
  The hook stages README.md but does NOT auto-commit.
  Run: git commit --amend --no-edit   to fold it into the last commit.
  A 5-second timestamp guard prevents any accidental re-trigger.

WITHOUT API KEY
  Hook still runs — shows which sections WOULD be updated.
  Set ANTHROPIC_API_KEY to enable actual AI updates.
`.trim());
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run: living-readme --help');
    process.exit(1);
}
