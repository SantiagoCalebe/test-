const CONFIG = {
    translation: {
        apiUrl: 'https://api.mymemory.translated.net/get',
        dailyLimit: 5000,
        email: ''
    },
    tts: {
        apiUrl: 'https://api.freetts.org/v1/synthesize',
        rateLimit: 20,
        voices: {
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
        }
    },
    elevenLabs: {
        apiKey: '',
        apiUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
        voiceId: '21m00s09m00s34m00s06m00s'
    }
};

const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
];