/**
 * API Module - Handles Gemini API integration
 * Manages resume analysis using Google's Gemini AI
 */

const GeminiAPI = {
    // API Configuration
    API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',

    /**
     * Analyze resume using Gemini API
     * @param {string} resumeText - The resume text content
     * @param {string} jobDescription - The job description (optional)
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeResume(resumeText, jobDescription, apiKey) {
        try {
            // Validate inputs
            if (!resumeText || !resumeText.trim()) {
                throw new Error('Resume text is required');
            }

            if (!apiKey || !apiKey.trim()) {
                throw new Error('API key is required');
            }

            // Create the prompt
            const prompt = this.createPrompt(resumeText, jobDescription);

            // Make API request
            const response = await this.makeAPIRequest(prompt, apiKey);

            // Parse and validate response
            const analysisResult = this.parseResponse(response);

            return analysisResult;
        } catch (error) {
            console.error('Error analyzing resume:', error);
            throw error;
        }
    },

    /**
     * Create prompt for Gemini API
     * @param {string} resumeText - Resume content
     * @param {string} jobDescription - Job description
     * @returns {string} Formatted prompt
     */
    createPrompt(resumeText, jobDescription) {
        resumeText = resumeText.substring(0, 4000);
        const hasJobDescription = jobDescription && jobDescription.trim();

        let prompt = `You are an expert resume analyzer and ATS (Applicant Tracking System) specialist. Analyze the following resume and provide a comprehensive evaluation.

RESUME:
${resumeText}
`;

        if (hasJobDescription) {
            prompt += `\nJOB DESCRIPTION:
${jobDescription}
`;
        }

        prompt += `

...Scoring Guidelines...

IMPORTANT:
Return ONLY valid JSON.

Do not use markdown.
Do not use \`\`\`json.
Do not include explanations.
Do not include text before or after the JSON.

Maximum:
- 3 strengths
- 3 weaknesses
- 3 suggestions

Use this exact format:

{
  "resumeScore": 0,
  "atsScore": 0,
  "jobMatch": 0,
  "skillsFound": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}
`;
        return prompt;
    },

    /**
     * Make API request to Gemini
     * @param {string} prompt - The prompt to send
     * @param {string} apiKey - API key
     * @returns {Promise<Object>} API response
     */
    async makeAPIRequest(prompt, apiKey) {
        const url = `${this.API_ENDPOINT}?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message ||
                `API request failed with status ${response.status}`
            );
        }

        return await response.json();
    },

    /**
     * Parse Gemini API response
     * @param {Object} response - API response
     * @returns {Object} Parsed analysis result
     */
    parseResponse(response) {
        try {
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('No response text received from API');
            }

            console.log("RAW RESPONSE:");
            console.log(text);

            // Extract JSON object from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }

            const analysisResult = JSON.parse(jsonMatch[0]);

            return {
                resumeScore: this.validateScore(analysisResult.resumeScore),
                atsScore: this.validateScore(analysisResult.atsScore),
                jobMatch: this.validateScore(analysisResult.jobMatch),
                skillsFound: analysisResult.skillsFound || [],
                missingSkills: analysisResult.missingSkills || [],
                strengths: analysisResult.strengths || [],
                weaknesses: analysisResult.weaknesses || [],
                suggestions: analysisResult.suggestions || []
            };

        } catch (error) {
            console.error("Parse Error:", error);
            console.error("Full Response:", response);
            throw new Error("Failed to parse API response.");
        }
    },

    /**
     * Validate and normalize score
     * @param {any} score - Score to validate
     * @returns {number} Validated score (0-100)
     */
    validateScore(score) {
        const numScore = Number(score);
        if (isNaN(numScore)) {
            return 0;
        }
        return Math.max(0, Math.min(100, Math.round(numScore)));
    },

    /**
     * Test API key validity
     * @param {string} apiKey - API key to test
     * @returns {Promise<boolean>} True if valid
     */
    async testApiKey(apiKey) {
        try {
            const testPrompt = 'Say "API key is valid" in JSON format: {"status": "valid"}';
            await this.makeAPIRequest(testPrompt, apiKey);
            return true;
        } catch (error) {
            console.error('API key test failed:', error);
            return false;
        }
    },

    /**
     * Extract text from file
     * @param {File} file - File to extract text from
     * @returns {Promise<string>} Extracted text
     */
    /**
 * Extract text from PDF using PDF.js
 */
async extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        text += content.items
            .map(item => item.str)
            .join(" ");
    }

    return text;
},
    async extractTextFromFile(file) {

    // PDF
    if (file.name.toLowerCase().endsWith('.pdf')) {
        return await this.extractPdfText(file);
    }

    // TXT
    if (file.type === 'text/plain') {
        return await file.text();
    }

    // Fallback
    return await file.text();
},

    /**
     * Validate file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];

        const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];

        // Check file size
        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size exceeds 5MB limit'
            };
        }

        // Check file type
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension && !allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Invalid file type. Please upload PDF, DOCX, or TXT files only'
            };
        }

        return {
            valid: true,
            error: null
        };
    }
};

// Make GeminiAPI available globally
if (typeof window !== 'undefined') {
    window.GeminiAPI = GeminiAPI;
}
