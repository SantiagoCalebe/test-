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
    }
    
    async speak(text, targetLang) {
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
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
            this.isPlaying = false;
        }
    }
}

window.Translator = Translator;
window.TextToSpeech = TextToSpeech;