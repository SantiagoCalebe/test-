const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

class VoiceRecognizer {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
        this.interimTranscript = '';
        
        if (!SpeechRecognition) {
            this.notSupported = true;
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.setupHandlers();
    }
    
    setupHandlers() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onStateChange?.('listening');
        };
        
        this.recognition.onresult = (event) => {
            this.interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript;
                    this.onResult?.(this.finalTranscript, true);
                } else {
                    this.interimTranscript += transcript;
                    this.onResult?.(this.interimTranscript, false);
                }
            }
        };
        
        this.recognition.onerror = (event) => {
            const errorMessages = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'No microphone detected.',
                'not-allowed': 'Microphone permission denied.',
                'network': 'Network error occurred.',
                'aborted': 'Recognition was cancelled.',
                'language-not-supported': 'Language not supported.'
            };
            
            const message = errorMessages[event.error] || `Error: ${event.error}`;
            this.onError?.(message);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.onStateChange?.('idle');
            
            if (this.finalTranscript) {
                this.onEnd?.(this.finalTranscript);
            }
        };
    }
    
    setLanguage(langCode) {
        const langMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'zh': 'zh-CN',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'ru': 'ru-RU',
            'ar': 'ar-SA',
            'hi': 'hi-IN'
        };
        
        this.recognition.lang = langMap[langCode] || langCode;
    }
    
    start() {
        if (!this.recognition) return false;
        
        this.finalTranscript = '';
        this.interimTranscript = '';
        
        try {
            this.recognition.start();
            return true;
        } catch (e) {
            console.error('Recognition start error:', e);
            return false;
        }
    }
    
    stop() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
        } catch (e) {
            console.error('Recognition stop error:', e);
        }
    }
    
    isSupported() {
        return !this.notSupported;
    }
}

window.VoiceRecognizer = VoiceRecognizer;