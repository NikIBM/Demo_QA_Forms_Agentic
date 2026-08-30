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
exports.generateSummaryReport = generateSummaryReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateSummaryReport(resultsDir, totalElapsedTime) {
    console.log('\n=== Generating Consolidated Summary Report ===');
    if (!fs.existsSync(resultsDir)) {
        console.error(`Results directory not found: ${resultsDir}`);
        return;
    }
    const testResults = [];
    let earliestStartTime = null;
    let latestEndTime = null;
    let environmentUrl = undefined;
    // Read all test folders
    const folders = fs.readdirSync(resultsDir).filter(f => {
        const fullPath = path.join(resultsDir, f);
        return fs.statSync(fullPath).isDirectory();
    }).sort();
    // Extract environment URL from the first test's spec file
    if (folders.length > 0) {
        const firstFolder = folders[0];
        const firstFolderPath = path.join(resultsDir, firstFolder);
        const jsonResultPath = path.join(firstFolderPath, 'test-results.json');
        if (fs.existsSync(jsonResultPath)) {
            try {
                const jsonData = JSON.parse(fs.readFileSync(jsonResultPath, 'utf-8'));
                // Extract spec file path from JSON
                if (jsonData.suites && jsonData.suites.length > 0 && jsonData.suites[0].file) {
                    const specFileRelativePath = jsonData.suites[0].file;
                    // Build absolute path: go up from resultsDir to workspace root, then add apps/specFile
                    const workspaceRoot = path.resolve(resultsDir, '..', '..', '..');
                    const specFilePath = path.join(workspaceRoot, 'apps', specFileRelativePath);
                    if (fs.existsSync(specFilePath)) {
                        const specContent = fs.readFileSync(specFilePath, 'utf-8');
                        // Look for pattern: const path = process.env.VARIABLE_NAME (with optional !)
                        const pathMatch = specContent.match(/const\s+path\s*=\s*process\.env\.(\w+)!?/);
                        if (pathMatch && pathMatch[1]) {
                            const envVarName = pathMatch[1];
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
    for (const folder of folders) {
        const folderPath = path.join(resultsDir, folder);
        const htmlFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));
        if (htmlFiles.length > 0) {
            const specFileName = htmlFiles[0].replace('.html', '');
            const jsonResultPath = path.join(folderPath, 'test-results.json');
            // Try to read JSON results for accurate data
            if (fs.existsSync(jsonResultPath)) {
                try {
                    const jsonData = JSON.parse(fs.readFileSync(jsonResultPath, 'utf-8'));
                    // Extract environment URL from the first test's config
                    if (!environmentUrl && jsonData.config && jsonData.config.use && jsonData.config.use.baseURL) {
                        environmentUrl = jsonData.config.use.baseURL;
                    }
                    // Get start time from stats
                    if (jsonData.stats && jsonData.stats.startTime) {
                        const startTime = new Date(jsonData.stats.startTime).getTime();
                        if (!earliestStartTime || startTime < earliestStartTime) {
                            earliestStartTime = startTime;
                        }
                        // Calculate end time for this spec file
                        const duration = jsonData.stats.duration || 0;
                        const endTime = startTime + duration;
                        if (!latestEndTime || endTime > latestEndTime) {
                            latestEndTime = endTime;
                        }
                    }
                    // Navigate through the nested structure to extract individual tests
                    if (jsonData.suites && jsonData.suites.length > 0) {
                        for (const topSuite of jsonData.suites) {
                            // Check if there are nested suites
                            if (topSuite.suites && topSuite.suites.length > 0) {
                                for (const suite of topSuite.suites) {
                                    if (suite.specs && suite.specs.length > 0) {
                                        for (const spec of suite.specs) {
                                            if (spec.tests && spec.tests.length > 0) {
                                                // Process each individual test
                                                for (const test of spec.tests) {
                                                    let testStatus = 'passed';
                                                    let testDuration = 0;
                                                    if (test.results && test.results.length > 0) {
                                                        const result = test.results[0];
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
                    console.error(`Error parsing JSON for ${specFileName}:`, error);
                }
            }
            else {
                // Fallback: create single entry if JSON doesn't exist
                const htmlPath = path.join(folderPath, htmlFiles[0]);
                const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
                let status = 'passed';
                if (htmlContent.includes('Test Failed') || htmlContent.includes('No report generated')) {
                    status = 'failed';
                }
                testResults.push({
                    specFileName: specFileName,
                    testName: specFileName,
                    status: status,
                    duration: 0,
                    reportPath: path.join(folder, htmlFiles[0]),
                    folderName: folder
                });
            }
        }
    }
    // Use actual test times or fallback to current time
    const startTime = earliestStartTime ? new Date(earliestStartTime).toISOString() : new Date().toISOString();
    const endTime = latestEndTime ? new Date(latestEndTime).toISOString() : new Date().toISOString();
    // Calculate actual elapsed time (not sum of individual tests)
    const actualElapsedTime = (earliestStartTime && latestEndTime)
        ? (latestEndTime - earliestStartTime)
        : testResults.reduce((sum, t) => sum + t.duration, 0);
    // Calculate unique spec file count
    const uniqueSpecFiles = new Set(testResults.map(t => t.specFileName));
    // Calculate statistics
    const stats = {
        total: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed' || t.status === 'timedout').length,
        skipped: testResults.filter(t => t.status === 'skipped').length,
        timedout: testResults.filter(t => t.status === 'timedout').length,
        totalDuration: actualElapsedTime,
        startTime: startTime,
        endTime: endTime,
        environmentUrl: environmentUrl || 'Not specified',
        specFileCount: uniqueSpecFiles.size,
        totalElapsedTime: totalElapsedTime
    };
    // Generate HTML report
    const html = generateHTML(stats, testResults, resultsDir);
    const summaryPath = path.join(resultsDir, 'TestExecutionSummary.html');
    fs.writeFileSync(summaryPath, html, 'utf-8');
    console.log(`✓ Summary report generated: ${summaryPath}`);
    console.log(`\nExecution Summary:`);
    console.log(`  Total Tests: ${stats.total}`);
    console.log(`  Passed: ${stats.passed}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Total Duration: ${formatDuration(stats.totalDuration)}`);
}
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    // Format as hh:mm:ss
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
function formatDateTime(isoString) {
    return new Date(isoString).toLocaleString();
}
function generateHTML(stats, results, resultsDir) {
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
    const failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : '0';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Summary Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.95;
        }
        
        .stats-container {
            display: flex;
            gap: 30px;
            padding: 30px;
            background: #f8f9fa;
            align-items: center;
        }
        
        .chart-container {
            flex: 0 0 300px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .chart-container canvas {
            max-width: 100%;
            height: auto !important;
        }
        
        .stats-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card .number {
            font-size: 2.2em;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .stat-card .label {
            font-size: 0.85em;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-card.total .number { color: #3498db; }
        .stat-card.passed .number { color: #2ecc71; }
        .stat-card.failed .number { color: #e74c3c; }
        .stat-card.skipped .number { color: #f39c12; }
        .stat-card.duration .number { font-size: 1.6em; }
        .stat-card.pass-rate .number { color: #2ecc71; }
        .stat-card.failure-rate .number { color: #e74c3c; }
        .stat-card.spec-files .number { color: #9b59b6; }
        .stat-card.total-elapsed .number { color: #16a085; font-size: 1.6em; }
        
        .search-sort-container {
            padding: 20px 30px;
            background: white;
            display: flex;
            gap: 15px;
            align-items: center;
            border-bottom: 1px solid #eee;
        }
        
        .search-box {
            flex: 1;
            max-width: 400px;
        }
        
        .search-box input {
            width: 100%;
            padding: 10px 15px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 0.95em;
            transition: border-color 0.3s ease;
        }
        
        .search-box input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .sort-box {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .sort-box label {
            font-weight: 600;
            color: #555;
        }
        
        .sort-box select {
            padding: 10px 15px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 0.95em;
            cursor: pointer;
            background: white;
            transition: border-color 0.3s ease;
        }
        
        .sort-box select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .info-section {
            padding: 20px 30px;
            background: white;
            border-bottom: 1px solid #eee;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 0.95em;
        }
        
        .info-label {
            font-weight: bold;
            color: #555;
        }
        
        .info-value {
            color: #333;
        }
        
        .results-section {
            padding: 30px;
        }
        
        .results-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .filter-buttons {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .filter-btn {
            padding: 10px 20px;
            border: 2px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.95em;
            transition: all 0.3s ease;
        }
        
        .filter-btn:hover {
            background: #f0f0f0;
        }
        
        .filter-btn.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        th {
            padding: 15px;
            text-align: center;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #eee;
            text-align: center;
        }
        
        td:nth-child(2) {
            text-align: left;
        }
        
        tbody tr {
            transition: background 0.2s ease;
        }
        
        tbody tr:hover {
            background: #f8f9fa;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-passed {
            background: #d4edda;
            color: #155724;
        }
        
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-skipped {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-timedout {
            background: #f8d7da;
            color: #721c24;
        }
        
        .report-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }
        
        .report-link:hover {
            color: #764ba2;
            text-decoration: underline;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .stats-container {
                flex-direction: column;
            }
            
            .chart-container {
                flex: 1 1 auto;
                width: 100%;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            table {
                font-size: 0.85em;
            }
            
            th, td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Test Execution Summary</h1>
            <p>Automated Test Results - Playwright Framework</p>
        </div>
        
        <div class="stats-container">
            <div class="chart-container">
                <canvas id="testChart"></canvas>
            </div>
            <div class="stats-grid">
                <div class="stat-card total">
                    <div class="number">${stats.total}</div>
                    <div class="label">Total Tests</div>
                </div>
                ${stats.totalElapsedTime ? `
                <div class="stat-card total-elapsed">
                    <div class="number">${formatDuration(stats.totalElapsedTime)}</div>
                    <div class="label">Total Elapsed Time</div>
                </div>
                ` : ''}
                <div class="stat-card duration">
                    <div class="number">${formatDuration(stats.totalDuration)}</div>
                    <div class="label">Total Execution Time</div>
                </div>
                <div class="stat-card spec-files">
                    <div class="number">${stats.specFileCount}</div>
                    <div class="label">Spec Files</div>
                </div>
                <div class="stat-card passed">
                    <div class="number">${stats.passed}</div>
                    <div class="label">Passed</div>
                </div>
                <div class="stat-card failed">
                    <div class="number">${stats.failed}</div>
                    <div class="label">Failed</div>
                </div>
                <div class="stat-card skipped">
                    <div class="number">${stats.skipped}</div>
                    <div class="label">Skipped</div>
                </div>
                <div class="stat-card pass-rate">
                    <div class="number">${passRate}%</div>
                    <div class="label">Pass Rate</div>
                </div>
                <div class="stat-card failure-rate">
                    <div class="number">${failureRate}%</div>
                    <div class="label">Failure Rate</div>
                </div>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">📁 Results Directory:</span>
                <span class="info-value">${path.basename(resultsDir)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🌐 Environment URL:</span>
                <span class="info-value">${stats.environmentUrl}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🕐 Execution Start Time:</span>
                <span class="info-value">${formatDateTime(stats.startTime)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🕑 Execution End Time:</span>
                <span class="info-value">${formatDateTime(stats.endTime)}</span>
            </div>
        </div>
        
        <div class="results-section">
            <h2>📊 Detailed Test Results</h2>
            
            <div class="search-sort-container">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="🔍 Search test names..." onkeyup="searchTests()">
                </div>
                <div class="sort-box">
                    <label>Sort by:</label>
                    <select id="sortSelect" onchange="sortTests()">
                        <option value="sequence">Sequence</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="duration">Duration (Low to High)</option>
                        <option value="duration-desc">Duration (High to Low)</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>
            
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterTests('all', this)">All Tests</button>
                <button class="filter-btn" onclick="filterTests('passed', this)">Passed Tests</button>
                <button class="filter-btn" onclick="filterTests('failed', this)">Failed Tests</button>
                <button class="filter-btn" onclick="filterTests('skipped', this)">Skipped Tests</button>
            </div>
            
            <table id="resultsTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Spec File Name</th>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Execution Time</th>
                        <th>Report</th>
                    </tr>
                </thead>
                <tbody>
${results.map((result, index) => `
                    <tr data-status="${result.status}" data-name="${result.testName.toLowerCase()}" data-duration="${result.duration}" data-sequence="${index + 1}">
                        <td>${index + 1}</td>
                        <td>${result.specFileName}</td>
                        <td>${result.testName}</td>
                        <td><span class="status-badge status-${result.status}">${result.status}</span></td>
                        <td>${formatDuration(result.duration)}</td>
                        <td><a href="${result.reportPath}" class="report-link" target="_blank">View Report →</a></td>
                    </tr>
`).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Generated on ${formatDateTime(new Date().toISOString())} | Playwright Test Framework</p>
        </div>
    </div>
    
    <script>
        // Initialize pie chart
        const ctx = document.getElementById('testChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${stats.passed}, ${stats.failed}, ${stats.skipped}],
                    backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Test Results Distribution',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 10
                        }
                    }
                }
            }
        });
        
        function filterTests(status, element) {
            const rows = document.querySelectorAll('#resultsTable tbody tr');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update button states
            buttons.forEach(btn => btn.classList.remove('active'));
            element.classList.add('active');
            
            // Filter rows
            rows.forEach(row => {
                if (status === 'all') {
                    row.style.display = '';
                } else {
                    row.style.display = row.dataset.status === status ? '' : 'none';
                }
            });
            
            // Renumber visible rows
            renumberRows();
        }
        
        function searchTests() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('#resultsTable tbody tr');
            
            rows.forEach(row => {
                const testName = row.dataset.name;
                if (testName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
            
            renumberRows();
        }
        
        function sortTests() {
            const sortBy = document.getElementById('sortSelect').value;
            const tbody = document.querySelector('#resultsTable tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            rows.sort((a, b) => {
                switch(sortBy) {
                    case 'name':
                        return a.dataset.name.localeCompare(b.dataset.name);
                    case 'name-desc':
                        return b.dataset.name.localeCompare(a.dataset.name);
                    case 'duration':
                        return parseFloat(a.dataset.duration) - parseFloat(b.dataset.duration);
                    case 'duration-desc':
                        return parseFloat(b.dataset.duration) - parseFloat(a.dataset.duration);
                    case 'status':
                        return a.dataset.status.localeCompare(b.dataset.status);
                    case 'sequence':
                    default:
                        return parseInt(a.dataset.sequence) - parseInt(b.dataset.sequence);
                }
            });
            
            // Clear and re-append sorted rows
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
            
            renumberRows();
        }
        
        function renumberRows() {
            const rows = document.querySelectorAll('#resultsTable tbody tr');
            let visibleIndex = 1;
            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    row.querySelector('td:first-child').textContent = visibleIndex++;
                }
            });
        }
    </script>
</body>
</html>`;
}
