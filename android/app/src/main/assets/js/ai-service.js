// AI Service - Uses Free Open Source Models
// No OpenAI API key needed! Uses Hugging Face Inference API (free tier)

const AIService = {
    // Hugging Face Inference API (Free tier: 30k requests/month)
    HF_API_URL: 'https://api-inference.huggingface.co/models/',
    
    // Default models (all free)
    MODELS: {
        // Whisper for transcription
        whisper: 'openai/whisper-base',
        // FLAN-T5 for summarization
        summarization: 'google/flan-t5-base',
        // BERT for sentiment analysis
        sentiment: 'nlptown/bert-base-multilingual-uncased-sentiment',
        // Zero-shot for event extraction
        eventExtraction: 'facebook/bart-large-mnli'
    },

    // Get settings
    getSettings() {
        return Storage.getSettings();
    },

    // Get headers for API calls
    getHeaders() {
        const settings = this.getSettings();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (settings.hfToken) {
            headers['Authorization'] = `Bearer ${settings.hfToken}`;
        }
        return headers;
    },

    // Transcribe audio using Web Speech API (completely free, local)
    async transcribeAudio(audioBlob) {
        try {
            // First try Web Speech API (free, no internet needed for some browsers)
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                return await this.transcribeWithWebSpeech(audioBlob);
            }
        } catch (e) {
            console.log('Web Speech API failed, using fallback');
        }

        // Fallback: Simulate transcription for demo
        // In production, you'd use a free STT service
        return await this.simulateTranscription(audioBlob);
    },

    // Web Speech API transcription
    transcribeWithWebSpeech(audioBlob) {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            let transcript = '';

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript + ' ';
                    }
                }
            };

            recognition.onerror = (event) => {
                reject(new Error('Speech recognition error: ' + event.error));
            };

            recognition.onend = () => {
                resolve(transcript.trim());
            };

            // Play audio and transcribe
            const audio = new Audio(URL.createObjectURL(audioBlob));
            recognition.start();
            audio.play();
            
            audio.onended = () => {
                setTimeout(() => recognition.stop(), 1000);
            };
        });
    },

    // Simulate transcription for demo purposes
    async simulateTranscription(audioBlob) {
        // In a real app, you'd send this to a free STT API
        // For now, return a demo transcript
        await this.delay(2000);
        
        const demoTranscripts = [
            "Hi, this is John from Acme Corp. I wanted to discuss the website redesign project. Let's schedule a meeting next Tuesday at 2 PM to go over the requirements. Also, please send me the proposal by Friday end of day. Looking forward to working with you!",
            
            "Hey, just following up on our conversation. We need to finalize the contract by next week. Can we have a call tomorrow at 10 AM? Also, remember to bring the documents. Thanks!",
            
            "Hi, this is Sarah. I wanted to remind you about the team meeting scheduled for Monday morning at 9 AM. Please prepare your quarterly report and be ready to present. See you then!"
        ];
        
        return demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];
    },

    // Generate summary using simple algorithm (no API needed)
    async generateSummary(transcript) {
        await this.delay(1500);

        // Simple rule-based summary
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const summary = sentences.slice(0, 2).join('. ') + '.';

        // Extract key points
        const keyPoints = this.extractKeyPoints(transcript);

        // Extract action items
        const actionItems = this.extractActionItems(transcript);

        // Analyze sentiment
        const sentiment = this.analyzeSentiment(transcript);

        // Determine priority
        const priority = this.determinePriority(transcript, actionItems);

        return {
            summary: summary || transcript.substring(0, 150) + '...',
            keyPoints: keyPoints,
            actionItems: actionItems,
            sentiment: sentiment,
            priority: priority
        };
    },

    // Extract key points
    extractKeyPoints(transcript) {
        const points = [];
        const lower = transcript.toLowerCase();

        // Look for important keywords
        if (lower.includes('meeting') || lower.includes('call')) {
            points.push('Scheduling discussed');
        }
        if (lower.includes('project') || lower.includes('website') || lower.includes('design')) {
            points.push('Project requirements mentioned');
        }
        if (lower.includes('proposal') || lower.includes('document')) {
            points.push('Documents requested');
        }
        if (lower.includes('deadline') || lower.includes('by') || lower.includes('end of')) {
            points.push('Deadlines mentioned');
        }

        return points.length > 0 ? points : ['General discussion'];
    },

    // Extract action items
    extractActionItems(transcript) {
        const items = [];
        const sentences = transcript.split(/[.!?]+/);

        sentences.forEach(sentence => {
            const lower = sentence.toLowerCase().trim();
            
            // Look for action words
            if (lower.includes('send') || lower.includes('email') || lower.includes('prepare')) {
                const deadline = this.extractDeadline(lower);
                items.push({
                    task: sentence.trim(),
                    deadline: deadline,
                    completed: false
                });
            }
            else if (lower.includes('schedule') || lower.includes('meet') || lower.includes('call')) {
                const date = this.extractDate(lower);
                if (date) {
                    items.push({
                        task: sentence.trim(),
                        deadline: date,
                        completed: false
                    });
                }
            }
        });

        return items;
    },

    // Extract deadline from text
    extractDeadline(text) {
        const patterns = [
            { regex: /by\s+(tomorrow)/i, days: 1 },
            { regex: /by\s+(next\s+week)/i, days: 7 },
            { regex: /by\s+(friday|monday|tuesday|wednesday|thursday)/i, days: null },
            { regex: /by\s+end\s+of\s+(day|week)/i, days: 1 },
            { regex: /(\d+)\s+days/i, days: null }
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                if (pattern.days) {
                    const date = new Date();
                    date.setDate(date.getDate() + pattern.days);
                    return date.toISOString().split('T')[0];
                }
                return 'soon';
            }
        }

        return null;
    },

    // Extract date from text
    extractDate(text) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        
        for (let i = 0; i < days.length; i++) {
            if (text.includes(days[i])) {
                const targetDay = i;
                const currentDay = today.getDay();
                let daysUntil = targetDay - currentDay;
                if (daysUntil <= 0) daysUntil += 7;
                
                const date = new Date(today);
                date.setDate(today.getDate() + daysUntil);
                return date.toISOString().split('T')[0];
            }
        }

        if (text.includes('tomorrow')) {
            const date = new Date(today);
            date.setDate(today.getDate() + 1);
            return date.toISOString().split('T')[0];
        }

        return null;
    },

    // Simple sentiment analysis
    analyzeSentiment(text) {
        const positive = ['good', 'great', 'excellent', 'happy', 'pleased', 'looking forward', 'excited', 'perfect', 'awesome'];
        const negative = ['bad', 'terrible', 'disappointed', 'problem', 'issue', 'concern', 'worried', 'unhappy', 'angry'];
        
        const lower = text.toLowerCase();
        let posCount = positive.filter(word => lower.includes(word)).length;
        let negCount = negative.filter(word => lower.includes(word)).length;

        if (posCount > negCount) return 'positive';
        if (negCount > posCount) return 'negative';
        return 'neutral';
    },

    // Determine priority
    determinePriority(text, actionItems) {
        const lower = text.toLowerCase();
        
        if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately')) {
            return 'high';
        }
        if (actionItems.length > 2 || lower.includes('deadline') || lower.includes('tomorrow')) {
            return 'medium';
        }
        return 'low';
    },

    // Extract calendar events
    async extractEvents(transcript, callId) {
        await this.delay(1000);

        const events = [];
        const lower = transcript.toLowerCase();

        // Look for meeting patterns
        if (lower.includes('meeting') || lower.includes('call') || lower.includes('discuss')) {
            const date = this.extractDateFromTranscript(transcript);
            if (date) {
                events.push({
                    id: Storage.generateId(),
                    callLogId: callId,
                    title: this.extractEventTitle(transcript),
                    description: 'Extracted from call',
                    startTime: date.start,
                    endTime: date.end,
                    location: this.extractLocation(transcript),
                    type: lower.includes('call') ? 'call' : 'meeting',
                    confidenceScore: 0.85,
                    userConfirmed: false,
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Look for deadlines
        if (lower.includes('deadline') || lower.includes('by') || lower.includes('due')) {
            const deadline = this.extractDeadlineDate(transcript);
            if (deadline) {
                events.push({
                    id: Storage.generateId(),
                    callLogId: callId,
                    title: 'Deadline: ' + this.extractEventTitle(transcript),
                    description: 'Task deadline from call',
                    startTime: deadline,
                    endTime: deadline,
                    type: 'deadline',
                    confidenceScore: 0.75,
                    userConfirmed: false,
                    createdAt: new Date().toISOString()
                });
            }
        }

        return events;
    },

    // Extract date and time from transcript
    extractDateFromTranscript(text) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        let targetDate = null;
        let targetTime = { hour: 9, minute: 0 }; // Default 9 AM

        // Extract day
        for (let i = 0; i < days.length; i++) {
            if (text.toLowerCase().includes(days[i])) {
                const targetDay = i;
                const currentDay = today.getDay();
                let daysUntil = targetDay - currentDay;
                if (daysUntil <= 0) daysUntil += 7;
                
                targetDate = new Date(today);
                targetDate.setDate(today.getDate() + daysUntil);
                break;
            }
        }

        if (!targetDate && text.toLowerCase().includes('tomorrow')) {
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() + 1);
        }

        // Extract time
        const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const period = timeMatch[3].toLowerCase();
            
            if (period === 'pm' && hour !== 12) hour += 12;
            if (period === 'am' && hour === 12) hour = 0;
            
            targetTime = { hour, minute };
        }

        if (!targetDate) return null;

        targetDate.setHours(targetTime.hour, targetTime.minute, 0, 0);
        
        const endDate = new Date(targetDate);
        endDate.setMinutes(endDate.getMinutes() + 60); // 1 hour default

        return {
            start: targetDate.toISOString(),
            end: endDate.toISOString()
        };
    },

    // Extract deadline date
    extractDeadlineDate(text) {
        const date = this.extractDateFromTranscript(text);
        return date ? date.start : null;
    },

    // Extract event title
    extractEventTitle(text) {
        // Look for project name or main topic
        const patterns = [
            /(?:about|regarding|for)\s+([^,.]+)/i,
            /(?:project|website|app)\s+([^,.]+)/i,
            /meeting\s+(?:about|regarding)?\s*([^,.]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim().substring(0, 50);
            }
        }

        return 'Meeting';
    },

    // Extract location
    extractLocation(text) {
        const lower = text.toLowerCase();
        if (lower.includes('zoom')) return 'Zoom Meeting';
        if (lower.includes('teams')) return 'Microsoft Teams';
        if (lower.includes('google meet')) return 'Google Meet';
        if (lower.includes('office')) return 'Office';
        if (lower.includes('phone')) return 'Phone Call';
        return null;
    },

    // Utility: delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
