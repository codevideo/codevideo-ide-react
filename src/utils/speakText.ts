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
      audioElement.volume = volume;
      audioElement.onended = () => {
        resolve();
      };
      audioElement.onerror = (e) => {
        console.error("Audio playback error:", e);
        resolve(); // Resolve instead of rejecting to prevent errors from bubbling up
      };
      audioElement.play().catch(async error => {
        try {
        // Extract the 'message' property from the error handle
        const messageHandle = await error.getProperty('message');
        const message = await messageHandle.jsonValue();
        console.error("Failed to play audio:", message);
        } catch (e) {
          console.error("Failed to extract error message:", e);
        }
        resolve(); // Resolve despite the error
      });
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