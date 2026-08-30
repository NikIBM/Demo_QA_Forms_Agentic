"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs = require("fs");
var path = require("path");
var TestController_1 = require("./apps/demoqa-e2e/utils/TestController");
var GenerateSummaryReport_1 = require("./GenerateSummaryReport");
var dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();
// Record start time for total elapsed time calculation
var executionStartTime = Date.now();
/*Set execLocation based on TEST_EXECUTION_LOCATION env variable (GITHUB or LOCAL)
If TEST_EXECUTION_LOCATION is set to GITHUB, then execLocation will be GITHUB. Otherwise, it defaults to LOCAL.*/
var execLocation = (process.env.TEST_EXECUTION_LOCATION === "GITHUB") ? "GITHUB" : "LOCAL";
/*Filter test files for execution on the basis of run, location, and sequenceOrder properties
If run is true, and location matches the execLocation, then include the test file
Also sort the test files by sequenceOrder property if it is defined, otherwise default to 0
This ensures that tests with sequenceOrder are executed in the specified order
If sequenceOrder is not defined, it will default to 0, and those tests will be executed first
This is useful for dependent tests where the order of execution matters*/
var testFilesToRun = TestController_1.testControlData
    .filter(function (test) {
    return test.run &&
        (!test.location || test.location.includes(execLocation));
})
    .sort(function (a, b) { var _a, _b; return ((_a = a.sequenceOrder) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sequenceOrder) !== null && _b !== void 0 ? _b : 0); })
    .map(function (test) { return test.file; });
console.log('Test files selected to run in sequence order:', testFilesToRun);
if (testFilesToRun.length === 0) {
    console.warn("No test files found for execution. Please check the TestController.ts file.");
    process.exit(0);
}
// Create a timestamped results folder
var now = new Date();
var offsetMs = now.getTimezoneOffset() * 60 * 1000;
var dateLocal = new Date(now.getTime() - offsetMs);
var currentDateTime = dateLocal.toISOString().slice(0, 19).replace(/[:.]/g, "-").replace("T", "_");
var resultsDir = '';
if (process.env.TEST_EXECUTION_LOCATION === 'LOCAL') {
    //Use this as result folder when running test locally
    resultsDir = path.join(process.cwd(), "AllTestResults/HTMLReports/Results_".concat(currentDateTime));
}
else if (process.env.TEST_EXECUTION_LOCATION === 'GITHUB') {
    //Use this as result folder when running test via GitHub Actions Workflow
    resultsDir = 'playwright-report';
}
else {
    // Fallback to local results folder if env variable is not set
    resultsDir = path.join(process.cwd(), "AllTestResults/HTMLReports/Results_".concat(currentDateTime));
}
fs.mkdirSync(resultsDir, { recursive: true });
console.log('Results folder:', resultsDir);
// Copy folders
function fastCopyFolder(src, dest) {
    if (process.platform === 'win32') {
        (0, child_process_1.execSync)("xcopy \"".concat(src, "\" \"").concat(dest, "\" /E /I /Y"), { stdio: 'inherit' });
    }
    else {
        (0, child_process_1.execSync)("cp -r \"".concat(src, "\" \"").concat(dest, "\"")); // Unix/Linux/macOS
    }
}
// Run each test and copy/rename report and data folder
for (var i = 0; i < testFilesToRun.length; i++) {
    var file = testFilesToRun[i];
    var testName = path.basename(file, '.spec.ts');
    var folderPrefix = "".concat(i + 1, "-"); // 1-based index
    console.log("\nRunning: ".concat(file));
    var testFailed = false;
    try {
        (0, child_process_1.execSync)("npx playwright test \"".concat(file, "\" --workers=1 --output=playwright-report --config=apps/demoqa-e2e/playwright.config.ts --headed"), { stdio: 'inherit' });
    }
    catch (error) {
        console.error("Test failed: ".concat(file));
        testFailed = true;
    }
    finally {
        try {
            var destDir = path.join(resultsDir, "".concat(folderPrefix).concat(testName));
            fs.mkdirSync(destDir, { recursive: true });
            var srcHtml = path.join(process.cwd(), 'playwright-report', 'index.html');
            var destHtml = path.join(destDir, "".concat(testName, ".html"));
            if (fs.existsSync(srcHtml)) {
                fs.copyFileSync(srcHtml, destHtml);
                console.log("Copied HTML report for ".concat(testName));
            }
            else {
                fs.writeFileSync(destHtml, "<html><body><h2>No report generated for ".concat(testName).concat(testFailed ? ' (Test Failed)' : '', "</h2></body></html>"));
                console.log("No HTML report found for ".concat(testName, ", created placeholder."));
            }
            var srcData = path.join(process.cwd(), 'playwright-report', 'data');
            var destData = path.join(destDir, 'data');
            if (fs.existsSync(srcData)) {
                fastCopyFolder(srcData, destData);
                console.log("Copied data folder for ".concat(testName));
            }
            else {
                console.log("No data folder found for ".concat(testName));
            }
            // Copy JSON results for summary report
            var srcJson = path.join(process.cwd(), 'test-results.json');
            var destJson = path.join(destDir, 'test-results.json');
            if (fs.existsSync(srcJson)) {
                fs.copyFileSync(srcJson, destJson);
                console.log("Copied JSON results for ".concat(testName));
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
            console.error("Error in finally block for ".concat(testName, ":"), copyError);
        }
    }
}
// Generate consolidated summary report after all tests complete
console.log('\n' + '='.repeat(60));
var totalElapsedTime = Date.now() - executionStartTime;
(0, GenerateSummaryReport_1.generateSummaryReport)(resultsDir, totalElapsedTime);
console.log('='.repeat(60) + '\n');
