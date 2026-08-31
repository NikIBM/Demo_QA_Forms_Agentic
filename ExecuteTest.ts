import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test'; // Importing chromium for PDF report generation
import * as TestControllerModule from './apps/demoqa-e2e/utils/TestController.js';
const testControlData = TestControllerModule.testControlData;
type TestController = typeof testControlData[number];
import { generateSummaryReport } from './GenerateSummaryReport.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Record start time for total elapsed time calculation
const executionStartTime = Date.now();

/*Set execLocation based on TEST_EXECUTION_LOCATION env variable (GITHUB or LOCAL)
If TEST_EXECUTION_LOCATION is set to GITHUB, then execLocation will be GITHUB. Otherwise, it defaults to LOCAL.*/

const execLocation: "LOCAL" | "GITHUB" = (process.env.TEST_EXECUTION_LOCATION === "GITHUB") ? "GITHUB" : "LOCAL";

/*Filter test files for execution on the basis of run, location, and sequenceOrder properties
If run is true, and location matches the execLocation, then include the test file
Also sort the test files by sequenceOrder property if it is defined, otherwise default to 0
This ensures that tests with sequenceOrder are executed in the specified order
If sequenceOrder is not defined, it will default to 0, and those tests will be executed first
This is useful for dependent tests where the order of execution matters*/

const testFilesToRun = testControlData
  .filter((test: TestController) =>
    test.run &&
    (!test.location || test.location.includes(execLocation))
  )
  .sort((a: TestController, b: TestController) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
  .map((test: TestController) => test.file);

console.log('Test files selected to run in sequence order:', testFilesToRun);

if (testFilesToRun.length === 0) {
  console.warn(`No test files found for execution. Please check the TestController.ts file.`);
  process.exit(0);
}

// Create a timestamped results folder
const now = new Date();
const offsetMs = now.getTimezoneOffset() * 60 * 1000;
const dateLocal = new Date(now.getTime() - offsetMs);
const currentDateTime = dateLocal.toISOString().slice(0, 19).replace(/[:.]/g, "-").replace("T", "_");

let resultsDir = '';

if ( process.env.TEST_EXECUTION_LOCATION === 'LOCAL' ) {
  //Use this as result folder when running test locally
  resultsDir = path.join(process.cwd(), `AllTestResults/HTMLReports/Results_${currentDateTime}`);
}
else if ( process.env.TEST_EXECUTION_LOCATION === 'GITHUB' ) {
  //Use this as result folder when running test via GitHub Actions Workflow
  resultsDir = 'playwright-report';
}
else {
  // Fallback to local results folder if env variable is not set
  resultsDir = path.join(process.cwd(), `AllTestResults/HTMLReports/Results_${currentDateTime}`);
}

fs.mkdirSync(resultsDir, { recursive: true });
console.log('Results folder:', resultsDir);

// Copy folders
function fastCopyFolder(src: string, dest: string) {
  if (process.platform === 'win32') {
    execSync(`xcopy "${src}" "${dest}" /E /I /Y`, { stdio: 'inherit' });
  } else {
    execSync(`cp -r "${src}" "${dest}"`); // Unix/Linux/macOS
  }
}

// Run each test and copy/rename report and data folder
for (let i = 0; i < testFilesToRun.length; i++) {
  const file = testFilesToRun[i];
  const testName = path.basename(file, '.spec.ts');
  const folderPrefix = `${i + 1}-`; // 1-based index
  console.log(`\nRunning: ${file}`);
  let testFailed = false;
  try {
    execSync(`npx playwright test "${file}" --workers=1 --output=playwright-report --headed`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Test failed: ${file}`);
    testFailed = true;
  } finally {
    try {
      const destDir = path.join(resultsDir, `${folderPrefix}${testName}`);
      fs.mkdirSync(destDir, { recursive: true });

      const srcHtml = path.join(process.cwd(), 'playwright-report', 'index.html');
      const destHtml = path.join(destDir, `${testName}.html`);
      if (fs.existsSync(srcHtml)) {
        fs.copyFileSync(srcHtml, destHtml);
        console.log(`Copied HTML report for ${testName}`);
      } else {
        fs.writeFileSync(destHtml, `<html><body><h2>No report generated for ${testName}${testFailed ? ' (Test Failed)' : ''}</h2></body></html>`);
        console.log(`No HTML report found for ${testName}, created placeholder.`);
      }

      const srcData = path.join(process.cwd(), 'playwright-report', 'data');
      const destData = path.join(destDir, 'data');
      if (fs.existsSync(srcData)) {
        fastCopyFolder(srcData, destData);
        console.log(`Copied data folder for ${testName}`);
      } else {
        console.log(`No data folder found for ${testName}`);
      }

      // Copy JSON results for summary report
      const srcJson = path.join(process.cwd(), 'test-results.json');
      const destJson = path.join(destDir, 'test-results.json');
      if (fs.existsSync(srcJson)) {
        fs.copyFileSync(srcJson, destJson);
        console.log(`Copied JSON results for ${testName}`);
      }

      if (process.env.TEST_EXECUTION_LOCATION === 'LOCAL' && fs.existsSync(path.join(process.cwd(), 'playwright-report'))) {
        fs.rmSync(path.join(process.cwd(), 'playwright-report'), { recursive: true, force: true });
      }

      // Clean up JSON file
      if (fs.existsSync(srcJson)) {
        fs.unlinkSync(srcJson);
      }
    } catch (copyError) {
      console.error(`Error in finally block for ${testName}:`, copyError);
    }
  }
}

// Generate consolidated summary report after all tests complete
console.log('\n' + '='.repeat(60));
const totalElapsedTime = Date.now() - executionStartTime;
generateSummaryReport(resultsDir, totalElapsedTime);
console.log('='.repeat(60) + '\n');
