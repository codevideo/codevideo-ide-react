// Keep track of the current utterance
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks the given text, canceling any currently playing speech first
 * @param text The text to speak
 * @returns A promise that resolves when speech is finished
 */
export const speakText = (text: string, volume: number, mp3Url?: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // First, cancel any ongoing speech or audio playback
    stopSpeaking();

    // if a url to an mp3 is provided, play the audio
    if (mp3Url) {
      const audioElement = new Audio(mp3Url);
      audioElement.onended = () => {
        resolve();
      };
      audioElement.play();
      return;
    }

    // else default to speech synthesis
    const speechSynthesis = window.speechSynthesis;
    
    // Create a new SpeechSynthesisUtterance object
    const utterance = new SpeechSynthesisUtterance(text);
    // Set the volume
    utterance.volume = volume;
    // Store reference to current utterance
    currentUtterance = utterance;
    // Resolve the promise when speech is done
    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    // Handle any errors
    utterance.onerror = (event) => {
      currentUtterance = null;
      // reject(`Speech synthesis error: ${event.error}`);
      resolve();
    };
    // Speak the text
    speechSynthesis.speak(utterance);
  });
};

/**
 * Immediately stops any ongoing speech synthesis or audio playback
 */
export const stopSpeaking = (): void => {
  // stop speech synthesis
  const speechSynthesis = window.speechSynthesis;
  // Cancel all queued utterances
  speechSynthesis.cancel();
  // Reset the current utterance reference
  currentUtterance = null;

  // stop all audio playbacks
  const audioElements = document.getElementsByTagName('audio');
  for (let i = 0; i < audioElements.length; i++) {
    audioElements[i].pause();
  }
};

/**
 * Checks if speech synthesis is currently active
 * @returns True if something is being spoken, false otherwise
 */
export const isSpeaking = (): boolean => {
  return window.speechSynthesis.speaking;
};