/**
 * Main Application Module
 * Handles UI interactions and application logic
 */

class ResumeAnalyzerApp {
    constructor() {
        // State
        this.currentFile = null;
        this.currentAnalysis = null;
        
        // Initialize app
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Load saved theme
        this.loadTheme();
        
        // Load saved API key
        this.loadApiKey();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load history
        this.loadHistory();
        
        console.log('AI Resume Analyzer initialized');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // File upload
        const resumeFile = document.getElementById('resumeFile');
        const browseBtn = document.getElementById('browseBtn');
        const uploadArea = document.getElementById('uploadArea');
        const removeFile = document.getElementById('removeFile');

        browseBtn?.addEventListener('click', () => resumeFile?.click());
        resumeFile?.addEventListener('change', (e) => this.handleFileSelect(e));
        removeFile?.addEventListener('click', () => this.removeFile());

        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea?.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea?.addEventListener('drop', (e) => this.handleDrop(e));

        // API key toggle
        const toggleApiKey = document.getElementById('toggleApiKey');
        toggleApiKey?.addEventListener('click', () => this.toggleApiKeyVisibility());

        // API key save on blur
        const apiKeyInput = document.getElementById('apiKey');
        apiKeyInput?.addEventListener('blur', () => this.saveApiKey());

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn?.addEventListener('click', () => this.analyzeResume());

        // Report actions
        const copyReportBtn = document.getElementById('copyReportBtn');
        const downloadReportBtn = document.getElementById('downloadReportBtn');
        
        copyReportBtn?.addEventListener('click', () => this.copyReport());
        downloadReportBtn?.addEventListener('click', () => this.downloadReport());
    }

    /**
     * Load and apply saved theme
     */
    loadTheme() {
        const savedTheme = StorageManager.getTheme() || 'light';
        this.applyTheme(savedTheme);
    }

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        StorageManager.saveTheme(newTheme);
    }

    /**
     * Apply theme to document
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    /**
     * Load saved API key
     */
    loadApiKey() {
        const savedApiKey = StorageManager.getApiKey();
        if (savedApiKey) {
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput) {
                apiKeyInput.value = savedApiKey;
            }
        }
    }

    /**
     * Save API key to storage
     */
    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput && apiKeyInput.value.trim()) {
            StorageManager.saveApiKey(apiKeyInput.value.trim());
        }
    }

    /**
     * Toggle API key visibility
     */
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.getElementById('toggleApiKey');
        const icon = toggleBtn?.querySelector('i');
        
        if (apiKeyInput && icon) {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                apiKeyInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }
    }

    /**
     * Handle file selection
     * @param {Event} event - Change event
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Handle drag over event
     * @param {Event} event - Drag event
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.classList.add('drag-over');
    }

    /**
     * Handle drag leave event
     * @param {Event} event - Drag event
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.classList.remove('drag-over');
    }

    /**
     * Handle file drop
     * @param {Event} event - Drop event
     */
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.classList.remove('drag-over');
        
        const file = event.dataTransfer.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Process uploaded file
     * @param {File} file - File to process
     */
    processFile(file) {
        // Validate file
        const validation = GeminiAPI.validateFile(file);
        
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        // Store file
        this.currentFile = file;

        // Update UI
        this.showFileInfo(file);
        this.hideError();
    }

    /**
     * Show file information
     * @param {File} file - Uploaded file
     */
    showFileInfo(file) {
        const uploadContent = document.querySelector('.upload-content');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');

        if (uploadContent && fileInfo && fileName) {
            uploadContent.style.display = 'none';
            fileInfo.style.display = 'flex';
            fileName.textContent = file.name;
        }
    }

    /**
     * Remove uploaded file
     */
    removeFile() {
        this.currentFile = null;
        
        const uploadContent = document.querySelector('.upload-content');
        const fileInfo = document.getElementById('fileInfo');
        const resumeFile = document.getElementById('resumeFile');

        if (uploadContent && fileInfo && resumeFile) {
            uploadContent.style.display = 'block';
            fileInfo.style.display = 'none';
            resumeFile.value = '';
        }
    }

    /**
     * Analyze resume
     */
    async analyzeResume() {
        try {
            // Validate inputs
            if (!this.currentFile) {
                this.showError('Please upload a resume file');
                return;
            }

            const apiKeyInput = document.getElementById('apiKey');
            const apiKey = apiKeyInput?.value.trim();

            if (!apiKey) {
                this.showError('Please enter your Gemini API key');
                apiKeyInput?.focus();
                return;
            }

            // Save API key
            this.saveApiKey();

            // Get job description
            const jobDescInput = document.getElementById('jobDescription');
            const jobDescription = jobDescInput?.value.trim() || '';

            // Show loading
            this.showLoading();
            this.hideError();
            this.hideResults();

            // Extract text from file
            const resumeText = await GeminiAPI.extractTextFromFile(this.currentFile);

            // Analyze resume
            const analysis = await GeminiAPI.analyzeResume(resumeText, jobDescription, apiKey);

            // Store analysis
            this.currentAnalysis = {
                ...analysis,
                fileName: this.currentFile.name,
                jobDescription: jobDescription
            };

            // Save to storage
            StorageManager.saveAnalysis(this.currentAnalysis);

            // Display results
            this.displayResults(analysis);

            // Hide loading
            this.hideLoading();

            // Reload history
            this.loadHistory();

            // Scroll to results
            this.scrollToResults();

        } catch (error) {
            console.error('Analysis error:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to analyze resume. Please try again.');
        }
    }

    /**
     * Display analysis results
     * @param {Object} analysis - Analysis results
     */
    displayResults(analysis) {
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }

        // Update scores
        this.updateScore('resumeScore', 'resumeScoreProgress', analysis.resumeScore);
        this.updateScore('atsScore', 'atsScoreProgress', analysis.atsScore);
        this.updateScore('jobMatchScore', 'jobMatchProgress', analysis.jobMatch);

        // Update skills
        this.displaySkills('skillsFound', analysis.skillsFound, 'found');
        this.displaySkills('missingSkills', analysis.missingSkills, 'missing');

        // Update strengths and weaknesses
        this.displayList('strengthsList', analysis.strengths);
        this.displayList('weaknessesList', analysis.weaknesses);

        // Update suggestions
        this.displayList('suggestionsList', analysis.suggestions);
    }

    /**
     * Update score display
     * @param {string} scoreId - Score element ID
     * @param {string} progressId - Progress bar element ID
     * @param {number} value - Score value
     */
    updateScore(scoreId, progressId, value) {
        const scoreElement = document.getElementById(scoreId);
        const progressElement = document.getElementById(progressId);

        if (scoreElement) {
            // Animate score
            this.animateValue(scoreElement, 0, value, 1000);
        }

        if (progressElement) {
            // Animate progress bar
            setTimeout(() => {
                progressElement.style.width = `${value}%`;
            }, 100);
        }
    }

    /**
     * Animate number value
     * @param {HTMLElement} element - Element to update
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration
     */
    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }

    /**
     * Display skills
     * @param {string} containerId - Container element ID
     * @param {Array} skills - Skills array
     * @param {string} type - Skill type ('found' or 'missing')
     */
    displaySkills(containerId, skills, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!skills || skills.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">None identified</p>';
            return;
        }

        skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = `skill-tag ${type}`;
            tag.textContent = skill;
            container.appendChild(tag);
        });
    }

    /**
     * Display list items
     * @param {string} listId - List element ID
     * @param {Array} items - Items array
     */
    displayList(listId, items) {
        const list = document.getElementById(listId);
        if (!list) return;

        list.innerHTML = '';

        if (!items || items.length === 0) {
            list.innerHTML = '<li style="color: var(--text-muted);">None identified</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
    }

    /**
     * Show loading animation
     */
    showLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (loadingContainer) {
            loadingContainer.style.display = 'block';
        }
        
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
        }
    }

    /**
     * Hide loading animation
     */
    hideLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
            
            // Auto-hide after 5 seconds
            setTimeout(() => this.hideError(), 5000);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    /**
     * Hide results section
     */
    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }

    /**
     * Scroll to results section
     */
    scrollToResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Copy report to clipboard
     */
    async copyReport() {
        if (!this.currentAnalysis) return;

        const reportText = this.generateReportText(this.currentAnalysis);

        try {
            await navigator.clipboard.writeText(reportText);
            this.showTemporaryMessage('Report copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showError('Failed to copy report');
        }
    }

    /**
     * Generate report text
     * @param {Object} analysis - Analysis data
     * @returns {string} Report text
     */
    generateReportText(analysis) {
        return `
AI RESUME ANALYSIS REPORT
========================

File: ${analysis.fileName}
Date: ${new Date().toLocaleDateString()}

SCORES
------
Resume Score: ${analysis.resumeScore}/100
ATS Compatibility: ${analysis.atsScore}/100
Job Match: ${analysis.jobMatch}/100

SKILLS FOUND
------------
${analysis.skillsFound.join(', ')}

MISSING SKILLS
--------------
${analysis.missingSkills.join(', ')}

STRENGTHS
---------
${analysis.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

WEAKNESSES
----------
${analysis.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

AI SUGGESTIONS
--------------
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---
Generated by AI Resume Analyzer
Powered by Google Gemini AI
        `.trim();
    }

    /**
     * Download report as PDF
     */
    downloadReport() {
        if (!this.currentAnalysis) return;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Set font
            doc.setFont('helvetica');

            // Title
            doc.setFontSize(20);
            doc.setTextColor(99, 102, 241);
            doc.text('AI Resume Analysis Report', 20, 20);

            // Metadata
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`File: ${this.currentAnalysis.fileName}`, 20, 30);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);

            // Scores
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Scores', 20, 50);
            
            doc.setFontSize(11);
            doc.text(`Resume Score: ${this.currentAnalysis.resumeScore}/100`, 25, 58);
            doc.text(`ATS Compatibility: ${this.currentAnalysis.atsScore}/100`, 25, 65);
            doc.text(`Job Match: ${this.currentAnalysis.jobMatch}/100`, 25, 72);

            let yPos = 85;

            // Skills Found
            doc.setFontSize(14);
            doc.text('Skills Found', 20, yPos);
            yPos += 8;
            doc.setFontSize(10);
            const skillsText = this.currentAnalysis.skillsFound.join(', ');
            const skillsLines = doc.splitTextToSize(skillsText, 170);
            doc.text(skillsLines, 25, yPos);
            yPos += skillsLines.length * 5 + 5;

            // Missing Skills
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(14);
            doc.text('Missing Skills', 20, yPos);
            yPos += 8;
            doc.setFontSize(10);
            const missingText = this.currentAnalysis.missingSkills.join(', ');
            const missingLines = doc.splitTextToSize(missingText, 170);
            doc.text(missingLines, 25, yPos);
            yPos += missingLines.length * 5 + 5;

            // Strengths
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(14);
            doc.text('Strengths', 20, yPos);
            yPos += 8;
            doc.setFontSize(10);
            this.currentAnalysis.strengths.forEach((strength, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                const lines = doc.splitTextToSize(`${index + 1}. ${strength}`, 170);
                doc.text(lines, 25, yPos);
                yPos += lines.length * 5 + 2;
            });

            // Weaknesses
            yPos += 5;
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(14);
            doc.text('Weaknesses', 20, yPos);
            yPos += 8;
            doc.setFontSize(10);
            this.currentAnalysis.weaknesses.forEach((weakness, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                const lines = doc.splitTextToSize(`${index + 1}. ${weakness}`, 170);
                doc.text(lines, 25, yPos);
                yPos += lines.length * 5 + 2;
            });

            // Suggestions
            yPos += 5;
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(14);
            doc.text('AI Suggestions', 20, yPos);
            yPos += 8;
            doc.setFontSize(10);
            this.currentAnalysis.suggestions.forEach((suggestion, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                const lines = doc.splitTextToSize(`${index + 1}. ${suggestion}`, 170);
                doc.text(lines, 25, yPos);
                yPos += lines.length * 5 + 2;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    'Generated by AI Resume Analyzer - Powered by Google Gemini AI',
                    105,
                    290,
                    { align: 'center' }
                );
            }

            // Save PDF
            doc.save(`resume-analysis-${Date.now()}.pdf`);
            this.showTemporaryMessage('Report downloaded successfully!');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            this.showError('Failed to download report');
        }
    }

    /**
     * Show temporary success message
     * @param {string} message - Message to show
     */
    showTemporaryMessage(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorMessage && errorText) {
            errorMessage.style.background = 'rgba(16, 185, 129, 0.1)';
            errorMessage.style.borderColor = 'var(--success-color)';
            errorMessage.style.color = 'var(--success-color)';
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
                errorMessage.style.background = '';
                errorMessage.style.borderColor = '';
                errorMessage.style.color = '';
            }, 3000);
        }
    }

    /**
     * Load and display history
     */
    loadHistory() {
        const analyses = StorageManager.getAllAnalyses();
        const historySection = document.getElementById('historySection');
        const historyList = document.getElementById('historyList');

        if (!historySection || !historyList) return;

        if (analyses.length === 0) {
            historySection.style.display = 'none';
            return;
        }

        historySection.style.display = 'block';
        historyList.innerHTML = '';

        analyses.forEach(analysis => {
            const item = this.createHistoryItem(analysis);
            historyList.appendChild(item);
        });
    }

    /**
     * Create history item element
     * @param {Object} analysis - Analysis data
     * @returns {HTMLElement} History item element
     */
    createHistoryItem(analysis) {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = new Date(analysis.timestamp).toLocaleDateString();
        const time = new Date(analysis.timestamp).toLocaleTimeString();

        item.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-title">${analysis.fileName}</span>
                <span class="history-item-date">${date} ${time}</span>
            </div>
            <div class="history-item-scores">
                <span>Resume: ${analysis.resumeScore}/100</span>
                <span>ATS: ${analysis.atsScore}/100</span>
                <span>Match: ${analysis.jobMatch}/100</span>
            </div>
        `;

        item.addEventListener('click', () => {
            this.currentAnalysis = analysis;
            this.displayResults(analysis);
            this.scrollToResults();
        });

        return item;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ResumeAnalyzerApp();
});
