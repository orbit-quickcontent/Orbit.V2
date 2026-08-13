const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🤖 Starting Claude-Level Autonomous Error Detection & Verification Runner...\n');

const rootDir = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const projects = [
  { name: 'Backend TypeScript Compilation', dir: path.join(rootDir, 'backend'), cmd: 'npx tsc --noEmit' },
  { name: 'Backend Vitest Test Suite', dir: path.join(rootDir, 'backend'), cmd: 'npx vitest run' },
  { name: 'Dashboard Web App TypeScript Compilation', dir: path.join(rootDir, 'dashboard-web-app'), cmd: 'npx tsc --noEmit' },
  { name: 'Dashboard Web App Unit Tests', dir: path.join(rootDir, 'dashboard-web-app'), cmd: 'npx vitest run' },
  { name: 'Editor Web App TypeScript Compilation', dir: path.join(rootDir, 'editor-web-app'), cmd: 'npx tsc --noEmit' },
  { name: 'Admin Dashboard TypeScript Compilation', dir: path.join(rootDir, 'apps', 'admin-dashboard'), cmd: 'npx tsc --noEmit' },
];

const report = [];

// 1. Run compilation and test suites across all projects
projects.forEach((proj) => {
  if (!fs.existsSync(proj.dir)) return;
  console.log(`🔍 Checking ${proj.name}...`);
  try {
    const stdout = execSync(proj.cmd, { cwd: proj.dir, encoding: 'utf8', stdio: 'pipe' });
    report.push({ name: proj.name, status: 'PASSED', errors: [] });
    console.log(`  ✅ Passed cleanly: ${proj.name}`);
  } catch (err) {
    const errorOutput = err.stdout || err.stderr || err.message;
    const lines = errorOutput.split('\n').filter(line => line.includes('error TS') || line.includes('FAIL') || line.includes('Error:'));
    report.push({ name: proj.name, status: 'FAILED', errors: lines, fullOutput: errorOutput });
    console.error(`  ❌ Failed: ${proj.name} (${lines.length || 1} issue(s))`);
  }
});

// 2. Android Kotlin File Scanner for bracket matching and syntax balance
const androidDirs = [
  path.join(rootDir, 'mobile', 'android-partner', 'app', 'src', 'main', 'java'),
  path.join(rootDir, 'mobile', 'android-client', 'app', 'src', 'main', 'java'),
];

androidDirs.forEach((androidDir) => {
  if (fs.existsSync(androidDir)) {
    const appName = androidDir.includes('android-client') ? 'Android Client App' : 'Android Partner App';
    console.log(`\n📱 Scanning ${appName} (Kotlin) for structural integrity...`);
    const kotlinErrors = [];

    function scanDirectory(dir) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath);
        } else if (file.endsWith('.kt')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const openCurly = (content.match(/\{/g) || []).length;
          const closeCurly = (content.match(/\}/g) || []).length;
          if (openCurly !== closeCurly) {
            kotlinErrors.push(`${path.relative(rootDir, fullPath)}: Mismatched braces ({: ${openCurly}, }: ${closeCurly})`);
          }
        }
      });
    }

    scanDirectory(androidDir);

    if (kotlinErrors.length === 0) {
      report.push({ name: `${appName} (Kotlin)`, status: 'PASSED', errors: [] });
      console.log(`  ✅ 0 structural errors in ${appName}.`);
    } else {
      report.push({ name: `${appName} (Kotlin)`, status: 'FAILED', errors: kotlinErrors });
      console.error(`  ❌ ${kotlinErrors.length} structural error(s) in ${appName}.`);
    }
  }
});

// 3. Print Summary Report
console.log('\n==================================================');
console.log('📊 ORBIT SYSTEM-WIDE VERIFICATION REPORT');
console.log('==================================================');

let totalFailures = 0;
report.forEach((item) => {
  if (item.status === 'PASSED') {
    console.log(`🟢 [PASSED] ${item.name}`);
  } else {
    totalFailures++;
    console.log(`🔴 [FAILED] ${item.name}`);
    item.errors.slice(0, 10).forEach((e) => console.log(`   - ${e}`));
  }
});

console.log('==================================================\n');

if (totalFailures === 0) {
  console.log('🎉 ALL SYSTEM CHECKS PASSED: 0 ERRORS DETECTED ACROSS ALL APPS & SERVICES.');
  process.exit(0);
} else {
  console.error(`⚠️ Found ${totalFailures} failing project check(s).`);
  process.exit(1);
}
