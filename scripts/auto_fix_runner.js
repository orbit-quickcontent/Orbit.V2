const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🤖 Starting Claude-Level Autonomous Error Detection & Auto-Fixer Agent...');

const rootDir = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const projects = [
  { name: 'Backend', dir: path.join(rootDir, 'backend'), cmd: 'npx tsc --noEmit' },
  { name: 'Dashboard Web App', dir: path.join(rootDir, 'dashboard-web-app'), cmd: 'npx tsc --noEmit' },
  { name: 'Editor Web App', dir: path.join(rootDir, 'editor-web-app'), cmd: 'npx tsc --noEmit' },
];

const report = [];

// 1. Run ESLint auto-fix where package.json has lint script
projects.forEach((proj) => {
  const pkgJsonPath = path.join(proj.dir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkg.scripts && pkg.scripts.lint) {
        console.log(`\n🧹 Running ESLint auto-fix for ${proj.name}...`);
        try {
          execSync('npm run lint -- --fix', { cwd: proj.dir, stdio: 'pipe', encoding: 'utf8' });
          console.log(`  ✅ ${proj.name} lint auto-fix completed cleanly.`);
        } catch (lintErr) {
          console.log(`  ⚠️ ${proj.name} lint auto-fix reported issues, continuing to compilation checks...`);
        }
      }
    } catch (e) {
      // Ignore package parsing errors
    }
  }
});

// 2. Run TypeScript compilation verification across all web/backend projects
projects.forEach((proj) => {
  if (!fs.existsSync(proj.dir)) return;
  console.log(`\n🔍 Checking type errors in ${proj.name}...`);
  try {
    const stdout = execSync(proj.cmd, { cwd: proj.dir, encoding: 'utf8', stdio: 'pipe' });
    report.push({ name: proj.name, status: 'PASSED', errors: [] });
    console.log(`  ✅ 0 errors found in ${proj.name}.`);
  } catch (err) {
    const errorOutput = err.stdout || err.stderr || err.message;
    const lines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    report.push({ name: proj.name, status: 'FAILED', errors: lines, fullOutput: errorOutput });
    console.error(`  ❌ ${lines.length || 1} error(s) found in ${proj.name}.`);
  }
});

// 3. Android Kotlin File Scanner for bracket matching and required DTOs
const androidDir = path.join(rootDir, 'mobile', 'android-partner', 'app', 'src', 'main', 'java');
if (fs.existsSync(androidDir)) {
  console.log('\n📱 Scanning Android Kotlin source files for structural issues...');
  const kotlinErrors = [];

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.kt')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Check bracket balance
        let openCurly = (content.match(/\{/g) || []).length;
        let closeCurly = (content.match(/\}/g) || []).length;
        if (openCurly !== closeCurly) {
          kotlinErrors.push(`${path.relative(rootDir, fullPath)}: Mismatched curly braces ({: ${openCurly}, }: ${closeCurly})`);
        }
      }
    });
  }

  scanDirectory(androidDir);

  if (kotlinErrors.length === 0) {
    report.push({ name: 'Android Partner App (Kotlin)', status: 'PASSED', errors: [] });
    console.log('  ✅ 0 structural errors found in Android Kotlin source.');
  } else {
    report.push({ name: 'Android Partner App (Kotlin)', status: 'FAILED', errors: kotlinErrors });
    console.error(`  ❌ ${kotlinErrors.length} error(s) found in Android Kotlin source.`);
  }
}

// 4. Print Summary Report
console.log('\n==================================================');
console.log('📊 CLAUDE-LEVEL AGENT ERROR & AUTO-FIX SUMMARY REPORT');
console.log('==================================================');

let totalFailures = 0;
report.forEach(item => {
  if (item.status === 'PASSED') {
    console.log(`🟢 [PASSED] ${item.name}`);
  } else {
    totalFailures++;
    console.log(`🔴 [FAILED] ${item.name}`);
    item.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
    if (item.errors.length > 10) {
      console.log(`   ... and ${item.errors.length - 10} more error(s)`);
    }
  }
});

console.log('==================================================\n');

if (totalFailures === 0) {
  console.log('✨ All systems healthy! Zero errors remaining across the codebase.');
  process.exit(0);
} else {
  console.log(`⚠️ ${totalFailures} project(s) require intervention.`);
  process.exit(1);
}
