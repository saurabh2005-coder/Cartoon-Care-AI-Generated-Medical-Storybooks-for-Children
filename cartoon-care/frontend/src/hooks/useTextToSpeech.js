/**
 * useTextToSpeech Hook
 * Provides text-to-speech functionality using Web Speech API (Browser built-in)
 * 100% FREE - No API keys needed!
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  /**
   * Generate and play speech from text using Web Speech API
   * Supports both English and Hindi languages
   */
  const speak = useCallback(async (text, options = {}) => {
    if (!text || text.trim().length === 0) {
      setError('No text to speak');
      return;
    }

    if (!window.speechSynthesis) {
      setError('Text-to-speech not supported in this browser');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Stop any currently playing speech
      window.speechSynthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Detect if text is Hindi (contains Devanagari characters or Hindi punctuation)
      const isHindi = /[\u0900-\u097F।]/.test(text);

      // Find appropriate voice based on language
      let selectedVoice;
      if (isHindi) {
        // Try to find Hindi voice
        selectedVoice = voices.find(v => 
          v.lang.includes('hi') || 
          v.lang.includes('hi-IN') ||
          v.name.includes('Hindi')
        );
        
        // Fallback to any Indian English voice if Hindi not available
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            v.lang.includes('en-IN') ||
            v.name.includes('Indian')
          );
        }
      } else {
        // Find a child-friendly English voice (female, higher pitch)
        selectedVoice = voices.find(v => 
          v.name.includes('Female') || 
          v.name.includes('Samantha') || 
          v.name.includes('Karen') ||
          v.name.includes('Google UK English Female') ||
          v.lang.includes('en')
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else if (isHindi) {
        utterance.lang = 'hi-IN';
      }

      // Child-friendly settings
      utterance.rate = options.rate || 0.9; // Slightly slower for children
      utterance.pitch = options.pitch || 1.2; // Higher pitch for child-friendly
      utterance.volume = options.volume || 1;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setError('Failed to play speech');
        setIsPlaying(false);
        setIsLoading(false);
        utteranceRef.current = null;
      };

      // Speak!
      window.speechSynthesis.speak(utterance);

    } catch (err) {
      console.error('TTS Error:', err);
      setError(err.message || 'Failed to generate speech');
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [voices]);

  /**
   * Stop currently playing speech
   */
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    utteranceRef.current = null;
  }, []);

  /**
   * Pause currently playing speech
   */
  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isLoading,
    error,
    voices,
  };
};
