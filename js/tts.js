class Translator {
    constructor() {
        this.apiUrl = CONFIG.translation.apiUrl;
        this.dailyLimit = CONFIG.translation.dailyLimit;
        this.todayChars = 0;
    }
    
    async translate(text, sourceLang, targetLang) {
        if (this.todayChars >= this.dailyLimit) {
            throw new Error('Daily translation limit reached. Try again tomorrow.');
        }
        
        const langPair = `${sourceLang}|${targetLang}`;
        const url = new URL(this.apiUrl);
        url.searchParams.set('q', text);
        url.searchParams.set('langpair', langPair);
        
        if (CONFIG.translation.email) {
            url.searchParams.set('de', CONFIG.translation.email);
        }
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Translation service unavailable.');
            }
            
            const data = await response.json();
            
            if (data.responseStatus === 403 || data.responseStatus === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            
            if (data.responseStatus !== 200) {
                throw new Error(data.responseDetails || 'Translation failed.');
            }
            
            this.todayChars += text.length;
            
            return data.responseData.translatedText;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Check your connection.');
            }
            throw error;
        }
    }
}

class TextToSpeech {
    constructor() {
        this.apiUrl = 'https://api.freetts.org/v1/synthesize';
        this.currentAudio = null;
        this.isPlaying = false;
        this.useElevenLabs = CONFIG.elevenLabs.apiKey && CONFIG.elevenLabs.apiKey.length > 0;
    }
    
    async speak(text, targetLang) {
        this.stop();
        
        if (this.useElevenLabs) {
            return this.speakWithElevenLabs(text, targetLang);
        }
        
        return this.speakWithFreeTTS(text, targetLang);
    }
    
    async speakWithFreeTTS(text, targetLang) {
        const voiceId = CONFIG.tts.voices[targetLang] || CONFIG.tts.voices['en'];
        
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('voice', voiceId);
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });
            
            if (!response.ok) {
                throw new Error('TTS service unavailable.');
            }
            
            const blob = await response.blob();
            
            if (blob.type === 'application/json') {
                const json = JSON.parse(await blob.text());
                throw new Error(json.message || 'TTS Error');
            }
            
            const audioUrl = URL.createObjectURL(blob);
            
            await this.playAudio(audioUrl);
            
            URL.revokeObjectURL(audioUrl);
            
            return true;
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
                throw new Error('Network error. Check your connection.');
            }
            throw error;
        }
    }
    
    async speakWithElevenLabs(text, targetLang) {
        const voiceId = CONFIG.elevenLabs.voiceId;
        const apiKey = CONFIG.elevenLabs.apiKey;
        
        try {
            const response = await fetch(`${CONFIG.elevenLabs.apiUrl}/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2'
                })
            });
            
            if (!response.ok) {
                throw new Error('ElevenLabs API error.');
            }
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            await this.playAudio(audioUrl);
            
            URL.revokeObjectURL(audioUrl);
            
            return true;
        } catch (error) {
            throw error;
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
            
            this.currentAudio.onerror = (e) => {
                this.isPlaying = false;
                this.currentAudio = null;
                reject(new Error('Audio playback failed.'));
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
    
    isCurrentlyPlaying() {
        return this.isPlaying;
    }
}

window.Translator = Translator;
window.TextToSpeech = TextToSpeech;