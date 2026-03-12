/**
 * voice.js
 * Handles Speech Recognition (STT) and Speech Synthesis (TTS).
 * Uses Web Speech API.
 */

export class VoiceHandler {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.synth = window.speechSynthesis;
        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
        };
    }

    /**
     * Starts listening and returns a promise that resolves with the final transcript.
     * @param {Function} onInterim - Callback for interim results
     * @returns {Promise<string>}
     */
    startListening(onInterim) {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                return reject(new Error('Speech Recognition not supported'));
            }

            let finalTranscript = '';
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                if (onInterim) onInterim(interimTranscript);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                resolve(finalTranscript);
            };

            this.recognition.start();
        });
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Speaks the given text.
     * @param {string} text 
     */
    speak(text) {
        if (!this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a nice female voice if available
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female'));
        if (preferredVoice) utterance.voice = preferredVoice;

        this.synth.speak(utterance);
    }

    stopSpeaking() {
        if (this.synth) this.synth.cancel();
    }
}

export default new VoiceHandler();
