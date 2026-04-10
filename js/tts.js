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
            if (voice) utterance.voice = voice;
        };
        
        if (speechSynthesis.getVoices().length > 0) loadVoices();
        else speechSynthesis.onvoiceschanged = loadVoices;
        
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
    async translate(text, sourceLang, targetLang) {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
        
        const res = await fetch(url);
        const textResponse = await res.text();

        try {
            const data = JSON.parse(textResponse);
            return data.responseData.translatedText;
        } catch (e) {
            console.error("Erro real da API:", textResponse);
            throw new Error("Erro ao traduzir");
        }
    }
}

window.Translator = Translator;
window.TextToSpeech = TextToSpeech;
