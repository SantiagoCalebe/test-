class VoiceTranslatorApp {
    constructor() {
        this.recognizer = null;
        this.translator = null;
        this.tts = null;
        
        this.sourceLang = 'en';
        this.targetLang = 'es';
        
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        this.bindElements();
        this.initializeServices();
        this.setupEventListeners();
        this.populateLanguageSelectors();
    }
    
    bindElements() {
        this.elements = {
            appBar: document.querySelector('.app-bar'),
            card: document.querySelector('.translator-card'),
            sourceLangSelect: document.getElementById('source-lang'),
            targetLangSelect: document.getElementById('target-lang'),
            micButton: document.getElementById('mic-button'),
            micIcon: document.getElementById('mic-icon'),
            originalText: document.getElementById('original-text'),
            translatedText: document.getElementById('translated-text'),
            loadingSpinner: document.querySelector('.loading-spinner'),
            loadingOverlay: document.querySelector('.loading-overlay'),
            errorMessage: document.querySelector('.error-message')
        };
    }
    
    initializeServices() {
        this.recognizer = new VoiceRecognizer();
        this.translator = new Translator();
        this.tts = new TextToSpeech();
        
        if (!this.recognizer.isSupported()) {
            this.showError('Speech recognition not supported in this browser. Use Chrome or Edge.');
            this.elements.micButton.disabled = true;
            return;
        }
        
        this.setupRecognizerCallbacks();
    }
    
    setupRecognizerCallbacks() {
        this.recognizer.onStateChange = (state) => {
            this.updateMicButtonState(state);
        };
        
        this.recognizer.onResult = (transcript, isFinal) => {
            this.elements.originalText.textContent = transcript;
            this.elements.originalText.classList.toggle('interim', !isFinal);
        };
        
        this.recognizer.onEnd = async (transcript) => {
            if (transcript.trim()) {
                await this.processTranslation(transcript);
            }
        };
        
        this.recognizer.onError = (message) => {
            this.hideLoading();
            this.showError(message);
            this.setMicButtonIdle();
        };
    }
    
    setupEventListeners() {
        this.elements.micButton.addEventListener('click', () => this.handleMicClick());
        
        this.elements.sourceLangSelect.addEventListener('change', (e) => {
            this.sourceLang = e.target.value;
            if (this.recognizer) {
                this.recognizer.setLanguage(this.sourceLang);
            }
        });
        
        this.elements.targetLangSelect.addEventListener('change', (e) => {
            this.targetLang = e.target.value;
        });
    }
    
    populateLanguageSelectors() {
        const options = LANGUAGES.map(lang => 
            `<option value="${lang.code}">${lang.name}</option>`
        ).join('');
        
        this.elements.sourceLangSelect.innerHTML = options;
        this.elements.targetLangSelect.innerHTML = options;
        
        this.elements.sourceLangSelect.value = this.sourceLang;
        this.elements.targetLangSelect.value = this.targetLang;
    }
    
    handleMicClick() {
        if (this.isProcessing) return;
        
        if (this.recognizer.isListening) {
            this.recognizer.stop();
            return;
        }
        
        this.clearDisplay();
        this.recognizer.setLanguage(this.sourceLang);
        this.recognizer.start();
    }
    
    async processTranslation(text) {
        this.showLoading();
        
        try {
            const translated = await this.translator.translate(text, this.sourceLang, this.targetLang);
            
            this.elements.translatedText.textContent = translated;
            this.hideLoading();
            
            await this.playTranslation(translated);
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            this.setMicButtonIdle();
        }
    }
    
    async playTranslation(text) {
        try {
            this.setMicButtonPlaying();
            await this.tts.speak(text, this.targetLang);
            this.setMicButtonIdle();
        } catch (error) {
            this.setMicButtonIdle();
            this.showError(error.message);
        }
    }
    
    updateMicButtonState(state) {
        const button = this.elements.micButton;
        const icon = this.elements.micIcon;
        
        button.classList.remove('listening', 'processing', 'playing');
        
        switch (state) {
            case 'listening':
                button.classList.add('listening');
                icon.textContent = 'stop';
                break;
            case 'processing':
                button.classList.add('processing');
                break;
            case 'playing':
                button.classList.add('playing');
                break;
            default:
                icon.textContent = 'mic';
        }
    }
    
    setMicButtonIdle() {
        this.updateMicButtonState('idle');
        this.isProcessing = false;
    }
    
    setMicButtonPlaying() {
        this.updateMicButtonState('playing');
    }
    
    clearDisplay() {
        this.elements.originalText.textContent = '';
        this.elements.translatedText.textContent = '';
        this.hideError();
    }
    
    showLoading() {
        this.isProcessing = true;
        this.elements.loadingOverlay.classList.add('visible');
        this.elements.loadingSpinner.classList.add('active');
        this.updateMicButtonState('processing');
    }
    
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('visible');
        this.elements.loadingSpinner.classList.remove('active');
    }
    
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('visible');
        
        setTimeout(() => this.hideError(), 5000);
    }
    
    hideError() {
        this.elements.errorMessage.classList.remove('visible');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new VoiceTranslatorApp();
});