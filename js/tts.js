class Translator {
    constructor() {
        this.todayChars = 0;
        this.dailyLimit = 5000;
    }
    
    async translate(text, sourceLang, targetLang) {
        if (this.todayChars >= this.dailyLimit) {
            throw new Error('Daily limit reached');
        }
        
        const langPair = `${sourceLang}|${targetLang}`;
        
        try {
            const response = await fetch(`/api/translate?text=${encodeURIComponent(text)}&langpair=${langPair}`);
            
            if (!response.ok) {
                throw new Error('Translation failed');
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.todayChars += text.length;
            
            return data.translatedText;
        } catch (error) {
            throw new Error('Network error. Try again.');
        }
    }
}

class TextToSpeech {
    constructor() {
        this.currentAudio = null;
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
        this.stop();
        
        if (this.useBrowserTTS) {
            return this.speakWithBrowser(text, targetLang);
        }
        
        return this.speakWithAPI(text, targetLang);
    }
    
    speakWithBrowser(text, targetLang) {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            const lang = this.voiceMap[targetLang] || 'en-US';
            utterance.lang = lang;
            
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
            if (voice) {
                utterance.voice = voice;
            }
            
            utterance.onend = () => {
                this.isPlaying = false;
                resolve();
            };
            
            utterance.onerror = () => {
                this.isPlaying = false;
                resolve();
            };
            
            this.isPlaying = true;
            speechSynthesis.speak(utterance);
        });
    }
    
    async speakWithAPI(text, targetLang) {
        this.stop();
        
        const voiceMap = {
            'en': 'en-US-JennyNeural',
            'es': 'es-ES-ElviraNeural',
            'fr': 'fr-FR-DeniseNeural',
            'de': 'de-DE-ConradNeural',
            'it': 'it-IT-ElsaNeural',
            'pt': 'pt-PT-RaquelNeural',
            'zh': 'zh-CN-XiaoxiaoNeural',
            'ja': 'ja-JP-KeitaNeural',
            'ko': 'ko-KR-SunHiNeural',
            'ru': 'ru-RU-DariyaNeural',
            'ar': 'ar-SA-ZariyahNeural',
            'hi': 'hi-IN-MadhurNeural'
        };
        
        const voice = voiceMap[targetLang] || voiceMap['en'];
        
        try {
            const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`);
            
            if (!response.ok) {
                throw new Error('TTS failed');
            }
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            await this.playAudio(audioUrl);
            
            URL.revokeObjectURL(audioUrl);
            
            return true;
        } catch (error) {
            throw new Error('Audio error. Try again.');
        }
    }
    
    async playAudio(url) {
        return new Promise((resolve, reject) => {
            this.currentAudio = new Audio(url);
            
            this.currentAudio.onended = () => {
                this.isPlaying = false;
                this.currentAudio = null;
                resolve();
            };
            
            this.currentAudio.onerror = () => {
                this.isPlaying = false;
                this.currentAudio = null;
                reject(new Error('Playback failed'));
            };
            
            this.isPlaying = true;
            this.currentAudio.play().catch(reject);
        });
    }
    
    stop() {
        if (this.useBrowserTTS) {
            speechSynthesis.cancel();
            this.isPlaying = false;
            return;
        }
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
            this.isPlaying = false;
        }
    }
}

window.Translator = Translator;
window.TextToSpeech = TextToSpeech;