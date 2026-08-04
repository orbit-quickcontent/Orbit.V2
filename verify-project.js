const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Starting project-wide verification...');
const results = [];

function runCheck(name, command, cwd) {
  console.log(`\n🏃 Running: ${name}...`);
  try {
    const output = execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' });
    results.push({ name, status: 'PASSED', output });
    console.log(`✅ ${name} passed.`);
  } catch (error) {
    results.push({ name, status: 'FAILED', output: error.stdout || error.stderr || error.message });
    console.error(`❌ ${name} failed.`);
  }
}

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'dashboard-web-app');
const backendDir = path.join(rootDir, 'backend');

// 1. Lint Frontend
runCheck('Frontend Linter', 'npm run lint', frontendDir);

// 2. Compile Frontend (TypeScript verification)
runCheck('Frontend TS Compilation Check', 'npx tsc --noEmit', frontendDir);

// 3. Run Frontend Unit Tests
runCheck('Frontend Unit Tests', 'npx vitest run', frontendDir);

// 4. Compile Backend (TypeScript verification)
runCheck('Backend TS Compilation Check', 'npx tsc --noEmit', backendDir);

console.log('\n======================================');
console.log('📊 VERIFICATION SUMMARY');
console.log('======================================');

let hasFailed = false;
results.forEach(r => {
  console.log(`- [${r.status}] ${r.name}`);
  if (r.status === 'FAILED') {
    hasFailed = true;
    console.log('\n--- Error Details ---');
    console.log(r.output);
    console.log('---------------------\n');
  }
});

if (hasFailed) {
  process.exit(1);
} else {
  console.log('\n✨ All checks passed successfully!');
  process.exit(0);
}
