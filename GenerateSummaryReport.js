"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSummaryReport = generateSummaryReport;
var fs = require("fs");
var path = require("path");
function generateSummaryReport(resultsDir, totalElapsedTime) {
    console.log('\n=== Generating Consolidated Summary Report ===');
    if (!fs.existsSync(resultsDir)) {
        console.error("Results directory not found: ".concat(resultsDir));
        return;
    }
    var testResults = [];
    var earliestStartTime = null;
    var latestEndTime = null;
    var environmentUrl = undefined;
    // Read all test folders
    var folders = fs.readdirSync(resultsDir).filter(function (f) {
        var fullPath = path.join(resultsDir, f);
        return fs.statSync(fullPath).isDirectory();
    }).sort();
    // Extract environment URL from the first test's spec file
    if (folders.length > 0) {
        var firstFolder = folders[0];
        var firstFolderPath = path.join(resultsDir, firstFolder);
        var jsonResultPath = path.join(firstFolderPath, 'test-results.json');
        if (fs.existsSync(jsonResultPath)) {
            try {
                var jsonData = JSON.parse(fs.readFileSync(jsonResultPath, 'utf-8'));
                // Extract spec file path from JSON
                if (jsonData.suites && jsonData.suites.length > 0 && jsonData.suites[0].file) {
                    var specFileRelativePath = jsonData.suites[0].file;
                    // Build absolute path: go up from resultsDir to workspace root, then add apps/specFile
                    var workspaceRoot = path.resolve(resultsDir, '..', '..', '..');
                    var specFilePath = path.join(workspaceRoot, 'apps', specFileRelativePath);
                    if (fs.existsSync(specFilePath)) {
                        var specContent = fs.readFileSync(specFilePath, 'utf-8');
                        // Look for pattern: const path = process.env.VARIABLE_NAME (with optional !)
                        var pathMatch = specContent.match(/const\s+path\s*=\s*process\.env\.(\w+)!?/);
                        if (pathMatch && pathMatch[1]) {
                            var envVarName = pathMatch[1];
                            environmentUrl = process.env[envVarName];
                        }
                    }
                }
            }
            catch (error) {
                console.log('Could not extract environment URL from spec file:', error);
            }
        }
    }
    // Parse each test result
    for (var _i = 0, folders_1 = folders; _i < folders_1.length; _i++) {
        var folder = folders_1[_i];
        var folderPath = path.join(resultsDir, folder);
        var htmlFiles = fs.readdirSync(folderPath).filter(function (f) { return f.endsWith('.html'); });
        if (htmlFiles.length > 0) {
            var specFileName = htmlFiles[0].replace('.html', '');
            var jsonResultPath = path.join(folderPath, 'test-results.json');
            // Try to read JSON results for accurate data
            if (fs.existsSync(jsonResultPath)) {
                try {
                    var jsonData = JSON.parse(fs.readFileSync(jsonResultPath, 'utf-8'));
                    // Extract environment URL from the first test's config
                    if (!environmentUrl && jsonData.config && jsonData.config.use && jsonData.config.use.baseURL) {
                        environmentUrl = jsonData.config.use.baseURL;
                    }
                    // Get start time from stats
                    if (jsonData.stats && jsonData.stats.startTime) {
                        var startTime_1 = new Date(jsonData.stats.startTime).getTime();
                        if (!earliestStartTime || startTime_1 < earliestStartTime) {
                            earliestStartTime = startTime_1;
                        }
                        // Calculate end time for this spec file
                        var duration = jsonData.stats.duration || 0;
                        var endTime_1 = startTime_1 + duration;
                        if (!latestEndTime || endTime_1 > latestEndTime) {
                            latestEndTime = endTime_1;
                        }
                    }
                    // Navigate through the nested structure to extract individual tests
                    if (jsonData.suites && jsonData.suites.length > 0) {
                        for (var _a = 0, _b = jsonData.suites; _a < _b.length; _a++) {
                            var topSuite = _b[_a];
                            // Check if there are nested suites
                            if (topSuite.suites && topSuite.suites.length > 0) {
                                for (var _c = 0, _d = topSuite.suites; _c < _d.length; _c++) {
                                    var suite = _d[_c];
                                    if (suite.specs && suite.specs.length > 0) {
                                        for (var _e = 0, _f = suite.specs; _e < _f.length; _e++) {
                                            var spec = _f[_e];
                                            if (spec.tests && spec.tests.length > 0) {
                                                // Process each individual test
                                                for (var _g = 0, _h = spec.tests; _g < _h.length; _g++) {
                                                    var test = _h[_g];
                                                    var testStatus = 'passed';
                                                    var testDuration = 0;
                                                    if (test.results && test.results.length > 0) {
                                                        var result = test.results[0];
                                                        // Map status correctly
                                                        if (result.status === 'timedOut') {
                                                            testStatus = 'timedout';
                                                        }
                                                        else {
                                                            testStatus = result.status;
                                                        }
                                                        // Get duration for this specific test
                                                        testDuration = result.duration || 0;
                                                    }
                                                    // Add individual test result
                                                    testResults.push({
                                                        specFileName: specFileName,
                                                        testName: spec.title || 'Unnamed Test',
                                                        status: testStatus,
                                                        duration: testDuration,
                                                        reportPath: path.join(folder, htmlFiles[0]),
                                                        folderName: folder
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    console.error("Error parsing JSON for ".concat(specFileName, ":"), error);
                }
            }
            else {
                // Fallback: create single entry if JSON doesn't exist
                var htmlPath = path.join(folderPath, htmlFiles[0]);
                var htmlContent = fs.readFileSync(htmlPath, 'utf-8');
                var status_1 = 'passed';
                if (htmlContent.includes('Test Failed') || htmlContent.includes('No report generated')) {
                    status_1 = 'failed';
                }
                testResults.push({
                    specFileName: specFileName,
                    testName: specFileName,
                    status: status_1,
                    duration: 0,
                    reportPath: path.join(folder, htmlFiles[0]),
                    folderName: folder
                });
            }
        }
    }
    // Use actual test times or fallback to current time
    var startTime = earliestStartTime ? new Date(earliestStartTime).toISOString() : new Date().toISOString();
    var endTime = latestEndTime ? new Date(latestEndTime).toISOString() : new Date().toISOString();
    // Calculate actual elapsed time (not sum of individual tests)
    var actualElapsedTime = (earliestStartTime && latestEndTime)
        ? (latestEndTime - earliestStartTime)
        : testResults.reduce(function (sum, t) { return sum + t.duration; }, 0);
    // Calculate unique spec file count
    var uniqueSpecFiles = new Set(testResults.map(function (t) { return t.specFileName; }));
    // Calculate statistics
    var stats = {
        total: testResults.length,
        passed: testResults.filter(function (t) { return t.status === 'passed'; }).length,
        failed: testResults.filter(function (t) { return t.status === 'failed' || t.status === 'timedout'; }).length,
        skipped: testResults.filter(function (t) { return t.status === 'skipped'; }).length,
        timedout: testResults.filter(function (t) { return t.status === 'timedout'; }).length,
        totalDuration: actualElapsedTime,
        startTime: startTime,
        endTime: endTime,
        environmentUrl: environmentUrl || 'Not specified',
        specFileCount: uniqueSpecFiles.size,
        totalElapsedTime: totalElapsedTime
    };
    // Generate HTML report
    var html = generateHTML(stats, testResults, resultsDir);
    var summaryPath = path.join(resultsDir, 'TestExecutionSummary.html');
    fs.writeFileSync(summaryPath, html, 'utf-8');
    console.log("\u2713 Summary report generated: ".concat(summaryPath));
    console.log("\nExecution Summary:");
    console.log("  Total Tests: ".concat(stats.total));
    console.log("  Passed: ".concat(stats.passed));
    console.log("  Failed: ".concat(stats.failed));
    console.log("  Skipped: ".concat(stats.skipped));
    console.log("  Total Duration: ".concat(formatDuration(stats.totalDuration)));
}
function formatDuration(ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    // Format as hh:mm:ss
    var hh = hours.toString().padStart(2, '0');
    var mm = minutes.toString().padStart(2, '0');
    var ss = seconds.toString().padStart(2, '0');
    return "".concat(hh, ":").concat(mm, ":").concat(ss);
}
function formatDateTime(isoString) {
    return new Date(isoString).toLocaleString();
}
function generateHTML(stats, results, resultsDir) {
    var passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
    var failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : '0';
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Test Execution Summary Report</title>\n    <script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>\n    <style>\n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n        \n        body {\n            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            padding: 20px;\n            min-height: 100vh;\n        }\n        \n        .container {\n            max-width: 1400px;\n            margin: 0 auto;\n            background: white;\n            border-radius: 12px;\n            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);\n            overflow: hidden;\n        }\n        \n        .header {\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            color: white;\n            padding: 30px;\n            text-align: center;\n        }\n        \n        .header h1 {\n            font-size: 2.5em;\n            margin-bottom: 10px;\n            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);\n        }\n        \n        .header p {\n            font-size: 1.1em;\n            opacity: 0.95;\n        }\n        \n        .stats-container {\n            display: flex;\n            gap: 30px;\n            padding: 30px;\n            background: #f8f9fa;\n            align-items: center;\n        }\n        \n        .chart-container {\n            flex: 0 0 300px;\n            background: white;\n            padding: 20px;\n            border-radius: 10px;\n            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n        }\n        \n        .chart-container canvas {\n            max-width: 100%;\n            height: auto !important;\n        }\n        \n        .stats-grid {\n            flex: 1;\n            display: grid;\n            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));\n            gap: 15px;\n        }\n        \n        .stat-card {\n            background: white;\n            padding: 20px;\n            border-radius: 10px;\n            text-align: center;\n            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n            transition: transform 0.3s ease, box-shadow 0.3s ease;\n        }\n        \n        .stat-card:hover {\n            transform: translateY(-5px);\n            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);\n        }\n        \n        .stat-card .number {\n            font-size: 2.2em;\n            font-weight: bold;\n            margin-bottom: 8px;\n        }\n        \n        .stat-card .label {\n            font-size: 0.85em;\n            color: #666;\n            text-transform: uppercase;\n            letter-spacing: 0.5px;\n        }\n        \n        .stat-card.total .number { color: #3498db; }\n        .stat-card.passed .number { color: #2ecc71; }\n        .stat-card.failed .number { color: #e74c3c; }\n        .stat-card.skipped .number { color: #f39c12; }\n        .stat-card.duration .number { font-size: 1.6em; }\n        .stat-card.pass-rate .number { color: #2ecc71; }\n        .stat-card.failure-rate .number { color: #e74c3c; }\n        .stat-card.spec-files .number { color: #9b59b6; }\n        .stat-card.total-elapsed .number { color: #16a085; font-size: 1.6em; }\n        \n        .search-sort-container {\n            padding: 20px 30px;\n            background: white;\n            display: flex;\n            gap: 15px;\n            align-items: center;\n            border-bottom: 1px solid #eee;\n        }\n        \n        .search-box {\n            flex: 1;\n            max-width: 400px;\n        }\n        \n        .search-box input {\n            width: 100%;\n            padding: 10px 15px;\n            border: 2px solid #ddd;\n            border-radius: 6px;\n            font-size: 0.95em;\n            transition: border-color 0.3s ease;\n        }\n        \n        .search-box input:focus {\n            outline: none;\n            border-color: #667eea;\n        }\n        \n        .sort-box {\n            display: flex;\n            gap: 10px;\n            align-items: center;\n        }\n        \n        .sort-box label {\n            font-weight: 600;\n            color: #555;\n        }\n        \n        .sort-box select {\n            padding: 10px 15px;\n            border: 2px solid #ddd;\n            border-radius: 6px;\n            font-size: 0.95em;\n            cursor: pointer;\n            background: white;\n            transition: border-color 0.3s ease;\n        }\n        \n        .sort-box select:focus {\n            outline: none;\n            border-color: #667eea;\n        }\n        \n        .info-section {\n            padding: 20px 30px;\n            background: white;\n            border-bottom: 1px solid #eee;\n        }\n        \n        .info-row {\n            display: flex;\n            justify-content: space-between;\n            padding: 10px 0;\n            font-size: 0.95em;\n        }\n        \n        .info-label {\n            font-weight: bold;\n            color: #555;\n        }\n        \n        .info-value {\n            color: #333;\n        }\n        \n        .results-section {\n            padding: 30px;\n        }\n        \n        .results-section h2 {\n            color: #333;\n            margin-bottom: 20px;\n            font-size: 1.8em;\n            border-bottom: 3px solid #667eea;\n            padding-bottom: 10px;\n        }\n        \n        .filter-buttons {\n            margin-bottom: 20px;\n            display: flex;\n            gap: 10px;\n            flex-wrap: wrap;\n        }\n        \n        .filter-btn {\n            padding: 10px 20px;\n            border: 2px solid #ddd;\n            background: white;\n            border-radius: 6px;\n            cursor: pointer;\n            font-size: 0.95em;\n            transition: all 0.3s ease;\n        }\n        \n        .filter-btn:hover {\n            background: #f0f0f0;\n        }\n        \n        .filter-btn.active {\n            background: #667eea;\n            color: white;\n            border-color: #667eea;\n        }\n        \n        table {\n            width: 100%;\n            border-collapse: collapse;\n            background: white;\n            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n            border-radius: 8px;\n            overflow: hidden;\n        }\n        \n        thead {\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            color: white;\n        }\n        \n        th {\n            padding: 15px;\n            text-align: center;\n            font-weight: 600;\n            text-transform: uppercase;\n            font-size: 0.9em;\n            letter-spacing: 0.5px;\n        }\n        \n        td {\n            padding: 15px;\n            border-bottom: 1px solid #eee;\n            text-align: center;\n        }\n        \n        td:nth-child(2) {\n            text-align: left;\n        }\n        \n        tbody tr {\n            transition: background 0.2s ease;\n        }\n        \n        tbody tr:hover {\n            background: #f8f9fa;\n        }\n        \n        .status-badge {\n            display: inline-block;\n            padding: 6px 16px;\n            border-radius: 20px;\n            font-weight: 600;\n            font-size: 0.85em;\n            text-transform: uppercase;\n            letter-spacing: 0.5px;\n        }\n        \n        .status-passed {\n            background: #d4edda;\n            color: #155724;\n        }\n        \n        .status-failed {\n            background: #f8d7da;\n            color: #721c24;\n        }\n        \n        .status-skipped {\n            background: #fff3cd;\n            color: #856404;\n        }\n        \n        .status-timedout {\n            background: #f8d7da;\n            color: #721c24;\n        }\n        \n        .report-link {\n            color: #667eea;\n            text-decoration: none;\n            font-weight: 600;\n            transition: color 0.3s ease;\n        }\n        \n        .report-link:hover {\n            color: #764ba2;\n            text-decoration: underline;\n        }\n        \n        .footer {\n            background: #f8f9fa;\n            padding: 20px;\n            text-align: center;\n            color: #666;\n            font-size: 0.9em;\n        }\n        \n        @media (max-width: 768px) {\n            .stats-container {\n                flex-direction: column;\n            }\n            \n            .chart-container {\n                flex: 1 1 auto;\n                width: 100%;\n            }\n            \n            .stats-grid {\n                grid-template-columns: 1fr;\n            }\n            \n            table {\n                font-size: 0.85em;\n            }\n            \n            th, td {\n                padding: 10px;\n            }\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <h1>\uD83C\uDFAF Test Execution Summary</h1>\n            <p>Automated Test Results - Playwright Framework</p>\n        </div>\n        \n        <div class=\"stats-container\">\n            <div class=\"chart-container\">\n                <canvas id=\"testChart\"></canvas>\n            </div>\n            <div class=\"stats-grid\">\n                <div class=\"stat-card total\">\n                    <div class=\"number\">".concat(stats.total, "</div>\n                    <div class=\"label\">Total Tests</div>\n                </div>\n                ").concat(stats.totalElapsedTime ? "\n                <div class=\"stat-card total-elapsed\">\n                    <div class=\"number\">".concat(formatDuration(stats.totalElapsedTime), "</div>\n                    <div class=\"label\">Total Elapsed Time</div>\n                </div>\n                ") : '', "\n                <div class=\"stat-card duration\">\n                    <div class=\"number\">").concat(formatDuration(stats.totalDuration), "</div>\n                    <div class=\"label\">Total Execution Time</div>\n                </div>\n                <div class=\"stat-card spec-files\">\n                    <div class=\"number\">").concat(stats.specFileCount, "</div>\n                    <div class=\"label\">Spec Files</div>\n                </div>\n                <div class=\"stat-card passed\">\n                    <div class=\"number\">").concat(stats.passed, "</div>\n                    <div class=\"label\">Passed</div>\n                </div>\n                <div class=\"stat-card failed\">\n                    <div class=\"number\">").concat(stats.failed, "</div>\n                    <div class=\"label\">Failed</div>\n                </div>\n                <div class=\"stat-card skipped\">\n                    <div class=\"number\">").concat(stats.skipped, "</div>\n                    <div class=\"label\">Skipped</div>\n                </div>\n                <div class=\"stat-card pass-rate\">\n                    <div class=\"number\">").concat(passRate, "%</div>\n                    <div class=\"label\">Pass Rate</div>\n                </div>\n                <div class=\"stat-card failure-rate\">\n                    <div class=\"number\">").concat(failureRate, "%</div>\n                    <div class=\"label\">Failure Rate</div>\n                </div>\n            </div>\n        </div>\n        \n        <div class=\"info-section\">\n            <div class=\"info-row\">\n                <span class=\"info-label\">\uD83D\uDCC1 Results Directory:</span>\n                <span class=\"info-value\">").concat(path.basename(resultsDir), "</span>\n            </div>\n            <div class=\"info-row\">\n                <span class=\"info-label\">\uD83C\uDF10 Environment URL:</span>\n                <span class=\"info-value\">").concat(stats.environmentUrl, "</span>\n            </div>\n            <div class=\"info-row\">\n                <span class=\"info-label\">\uD83D\uDD50 Execution Start Time:</span>\n                <span class=\"info-value\">").concat(formatDateTime(stats.startTime), "</span>\n            </div>\n            <div class=\"info-row\">\n                <span class=\"info-label\">\uD83D\uDD51 Execution End Time:</span>\n                <span class=\"info-value\">").concat(formatDateTime(stats.endTime), "</span>\n            </div>\n        </div>\n        \n        <div class=\"results-section\">\n            <h2>\uD83D\uDCCA Detailed Test Results</h2>\n            \n            <div class=\"search-sort-container\">\n                <div class=\"search-box\">\n                    <input type=\"text\" id=\"searchInput\" placeholder=\"\uD83D\uDD0D Search test names...\" onkeyup=\"searchTests()\">\n                </div>\n                <div class=\"sort-box\">\n                    <label>Sort by:</label>\n                    <select id=\"sortSelect\" onchange=\"sortTests()\">\n                        <option value=\"sequence\">Sequence</option>\n                        <option value=\"name\">Name (A-Z)</option>\n                        <option value=\"name-desc\">Name (Z-A)</option>\n                        <option value=\"duration\">Duration (Low to High)</option>\n                        <option value=\"duration-desc\">Duration (High to Low)</option>\n                        <option value=\"status\">Status</option>\n                    </select>\n                </div>\n            </div>\n            \n            <div class=\"filter-buttons\">\n                <button class=\"filter-btn active\" onclick=\"filterTests('all', this)\">All Tests</button>\n                <button class=\"filter-btn\" onclick=\"filterTests('passed', this)\">Passed Tests</button>\n                <button class=\"filter-btn\" onclick=\"filterTests('failed', this)\">Failed Tests</button>\n                <button class=\"filter-btn\" onclick=\"filterTests('skipped', this)\">Skipped Tests</button>\n            </div>\n            \n            <table id=\"resultsTable\">\n                <thead>\n                    <tr>\n                        <th>#</th>\n                        <th>Spec File Name</th>\n                        <th>Test Name</th>\n                        <th>Status</th>\n                        <th>Execution Time</th>\n                        <th>Report</th>\n                    </tr>\n                </thead>\n                <tbody>\n").concat(results.map(function (result, index) { return "\n                    <tr data-status=\"".concat(result.status, "\" data-name=\"").concat(result.testName.toLowerCase(), "\" data-duration=\"").concat(result.duration, "\" data-sequence=\"").concat(index + 1, "\">\n                        <td>").concat(index + 1, "</td>\n                        <td>").concat(result.specFileName, "</td>\n                        <td>").concat(result.testName, "</td>\n                        <td><span class=\"status-badge status-").concat(result.status, "\">").concat(result.status, "</span></td>\n                        <td>").concat(formatDuration(result.duration), "</td>\n                        <td><a href=\"").concat(result.reportPath, "\" class=\"report-link\" target=\"_blank\">View Report \u2192</a></td>\n                    </tr>\n"); }).join(''), "\n                </tbody>\n            </table>\n        </div>\n        \n        <div class=\"footer\">\n            <p>Generated on ").concat(formatDateTime(new Date().toISOString()), " | Playwright Test Framework</p>\n        </div>\n    </div>\n    \n    <script>\n        // Initialize pie chart\n        const ctx = document.getElementById('testChart').getContext('2d');\n        new Chart(ctx, {\n            type: 'pie',\n            data: {\n                labels: ['Passed', 'Failed', 'Skipped'],\n                datasets: [{\n                    data: [").concat(stats.passed, ", ").concat(stats.failed, ", ").concat(stats.skipped, "],\n                    backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12'],\n                    borderWidth: 2,\n                    borderColor: '#fff'\n                }]\n            },\n            options: {\n                responsive: true,\n                maintainAspectRatio: true,\n                plugins: {\n                    legend: {\n                        position: 'bottom',\n                        labels: {\n                            padding: 15,\n                            font: {\n                                size: 12\n                            }\n                        }\n                    },\n                    title: {\n                        display: true,\n                        text: 'Test Results Distribution',\n                        font: {\n                            size: 14,\n                            weight: 'bold'\n                        },\n                        padding: {\n                            bottom: 10\n                        }\n                    }\n                }\n            }\n        });\n        \n        function filterTests(status, element) {\n            const rows = document.querySelectorAll('#resultsTable tbody tr');\n            const buttons = document.querySelectorAll('.filter-btn');\n            \n            // Update button states\n            buttons.forEach(btn => btn.classList.remove('active'));\n            element.classList.add('active');\n            \n            // Filter rows\n            rows.forEach(row => {\n                if (status === 'all') {\n                    row.style.display = '';\n                } else {\n                    row.style.display = row.dataset.status === status ? '' : 'none';\n                }\n            });\n            \n            // Renumber visible rows\n            renumberRows();\n        }\n        \n        function searchTests() {\n            const searchTerm = document.getElementById('searchInput').value.toLowerCase();\n            const rows = document.querySelectorAll('#resultsTable tbody tr');\n            \n            rows.forEach(row => {\n                const testName = row.dataset.name;\n                if (testName.includes(searchTerm)) {\n                    row.style.display = '';\n                } else {\n                    row.style.display = 'none';\n                }\n            });\n            \n            renumberRows();\n        }\n        \n        function sortTests() {\n            const sortBy = document.getElementById('sortSelect').value;\n            const tbody = document.querySelector('#resultsTable tbody');\n            const rows = Array.from(tbody.querySelectorAll('tr'));\n            \n            rows.sort((a, b) => {\n                switch(sortBy) {\n                    case 'name':\n                        return a.dataset.name.localeCompare(b.dataset.name);\n                    case 'name-desc':\n                        return b.dataset.name.localeCompare(a.dataset.name);\n                    case 'duration':\n                        return parseFloat(a.dataset.duration) - parseFloat(b.dataset.duration);\n                    case 'duration-desc':\n                        return parseFloat(b.dataset.duration) - parseFloat(a.dataset.duration);\n                    case 'status':\n                        return a.dataset.status.localeCompare(b.dataset.status);\n                    case 'sequence':\n                    default:\n                        return parseInt(a.dataset.sequence) - parseInt(b.dataset.sequence);\n                }\n            });\n            \n            // Clear and re-append sorted rows\n            tbody.innerHTML = '';\n            rows.forEach(row => tbody.appendChild(row));\n            \n            renumberRows();\n        }\n        \n        function renumberRows() {\n            const rows = document.querySelectorAll('#resultsTable tbody tr');\n            let visibleIndex = 1;\n            rows.forEach(row => {\n                if (row.style.display !== 'none') {\n                    row.querySelector('td:first-child').textContent = visibleIndex++;\n                }\n            });\n        }\n    </script>\n</body>\n</html>");
}
