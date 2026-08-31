"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TestControllerModule = __importStar(require("./apps/demoqa-e2e/utils/TestController.js"));
const testControlData = TestControllerModule.testControlData;
const GenerateSummaryReport_js_1 = require("./GenerateSummaryReport.js");
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
// Record start time for total elapsed time calculation
const executionStartTime = Date.now();
/*Set execLocation based on TEST_EXECUTION_LOCATION env variable (GITHUB or LOCAL)
If TEST_EXECUTION_LOCATION is set to GITHUB, then execLocation will be GITHUB. Otherwise, it defaults to LOCAL.*/
const execLocation = (process.env.TEST_EXECUTION_LOCATION === "GITHUB") ? "GITHUB" : "LOCAL";
/*Filter test files for execution on the basis of run, location, and sequenceOrder properties
If run is true, and location matches the execLocation, then include the test file
Also sort the test files by sequenceOrder property if it is defined, otherwise default to 0
This ensures that tests with sequenceOrder are executed in the specified order
If sequenceOrder is not defined, it will default to 0, and those tests will be executed first
This is useful for dependent tests where the order of execution matters*/
const testFilesToRun = testControlData
    .filter((test) => test.run &&
    (!test.location || test.location.includes(execLocation)))
    .sort((a, b) => { var _a, _b; return ((_a = a.sequenceOrder) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sequenceOrder) !== null && _b !== void 0 ? _b : 0); })
    .map((test) => test.file);
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
if (process.env.TEST_EXECUTION_LOCATION === 'LOCAL') {
    //Use this as result folder when running test locally
    resultsDir = path.join(process.cwd(), `AllTestResults/HTMLReports/Results_${currentDateTime}`);
}
else if (process.env.TEST_EXECUTION_LOCATION === 'GITHUB') {
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
function fastCopyFolder(src, dest) {
    if (process.platform === 'win32') {
        (0, child_process_1.execSync)(`xcopy "${src}" "${dest}" /E /I /Y`, { stdio: 'inherit' });
    }
    else {
        (0, child_process_1.execSync)(`cp -r "${src}" "${dest}"`); // Unix/Linux/macOS
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
        (0, child_process_1.execSync)(`npx playwright test "${file}" --workers=1 --output=playwright-report --headed`, { stdio: 'inherit' });
    }
    catch (error) {
        console.error(`Test failed: ${file}`);
        testFailed = true;
    }
    finally {
        try {
            const destDir = path.join(resultsDir, `${folderPrefix}${testName}`);
            fs.mkdirSync(destDir, { recursive: true });
            const srcHtml = path.join(process.cwd(), 'playwright-report', 'index.html');
            const destHtml = path.join(destDir, `${testName}.html`);
            if (fs.existsSync(srcHtml)) {
                fs.copyFileSync(srcHtml, destHtml);
                console.log(`Copied HTML report for ${testName}`);
            }
            else {
                fs.writeFileSync(destHtml, `<html><body><h2>No report generated for ${testName}${testFailed ? ' (Test Failed)' : ''}</h2></body></html>`);
                console.log(`No HTML report found for ${testName}, created placeholder.`);
            }
            const srcData = path.join(process.cwd(), 'playwright-report', 'data');
            const destData = path.join(destDir, 'data');
            if (fs.existsSync(srcData)) {
                fastCopyFolder(srcData, destData);
                console.log(`Copied data folder for ${testName}`);
            }
            else {
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
        }
        catch (copyError) {
            console.error(`Error in finally block for ${testName}:`, copyError);
        }
    }
}
// Generate consolidated summary report after all tests complete
console.log('\n' + '='.repeat(60));
const totalElapsedTime = Date.now() - executionStartTime;
(0, GenerateSummaryReport_js_1.generateSummaryReport)(resultsDir, totalElapsedTime);
console.log('='.repeat(60) + '\n');
