class TextToSpeech {
    constructor() {
        this.isPlaying = false;
        this.useBrowserTTS = 'speechSynthesis' in window;
        this.voiceMap = {
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
    }
    
    async speak(text, targetLang) {
        if (!this.useBrowserTTS) {
            console.log('Browser TTS not supported');
            return;
        }
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const lang = this.voiceMap[targetLang] || 'en-US';
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
            if (voice) {
                utterance.voice = voice;
            }
        };
        
        if (speechSynthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        return new Promise((resolve) => {
            utterance.onend = () => { this.isPlaying = false; resolve(); };
            utterance.onerror = () => { this.isPlaying = false; resolve(); };
            this.isPlaying = true;
            speechSynthesis.speak(utterance);
        });
    }
    
    stop() {
        speechSynthesis.cancel();
        this.isPlaying = false;
    }
}

class Translator {
    constructor() {
        this.apiUrl = 'https://api.mymemory.translated.net/get';
    }
    
    async translate(text, sourceLang, targetLang) {
        const langPair = `${sourceLang}|${targetLang}`;
        const url = `${this.apiUrl}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return data.responseData.translatedText;
    }
}

window.Translator = Translator;
window.TextToSpeech = TextToSpeech;