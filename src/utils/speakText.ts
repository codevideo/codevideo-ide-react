// Keep track of the current utterance
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks the given text, canceling any currently playing speech first
 * @param text The text to speak
 * @returns A promise that resolves when speech is finished
 */
export const speakText = async (text: string, volume: number, mp3Url?: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // First, cancel any ongoing speech or audio playback
    stopSpeaking();

    // if a url to an mp3 is provided, play the audio
    if (mp3Url) {
      console.log("Creating audio element for MP3 URL:", mp3Url);
      console.log("Volume", volume);
      const audioElement = new Audio(mp3Url);
      audioElement.volume = volume;
      audioElement.onended = () => {
        resolve();
      };
      audioElement.onerror = (e: string | Event) => {
        if (typeof e === 'string') {
          console.error("Audio playback error:", e);
        } else {
          try {
            // e is an Event
            console.error("Audio error event:", e.type);
            // Access specific properties if available, for instance:
            if (e.target && (e.target as any).error) {
              console.error("Error details:", (e.target as any).error);
            }
          } catch (e) {
            console.error("Failed to extract error details:", e);
          }
        }
        resolve(); // Resolve instead of rejecting to prevent errors from bubbling up
      };
      audioElement.play().catch(async error => {
        try {
          if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}\nStack: ${error.stack}`);
          } else {
            console.error(String(error));
          }
          // Option 1: Convert error to string directly
          console.error(String(error));
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







// leftovers from trials with audio playing in headless chromium:

export const playAudio = async (url: string) => {
  try {
    const dataURL = await fetchAudioAsDataURL(url);
    
    // Create and play audio with the data URL
    const audio = new Audio(dataURL);
    audio.addEventListener("error", (e) => {
      console.error("Audio error event:", e.type);
      console.error("Error details:", audio.error);
    });
    
    console.log("Playing audio from data URL...");
    audio.play().catch(err => {
      console.error("Play error:", err);
    });
  } catch (error) {
    console.error("Failed to play audio:", error);
  }
}
export const fetchAudioAsDataURL = async (url: string): Promise<string> => {
  try {
    // Fetch the audio file
    console.log(`Fetching audio from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    console.log(`Received blob of type: ${blob.type}, size: ${blob.size} bytes`);
    
    // Convert blob to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result;
        if (typeof dataURL !== 'string') {
          reject(new Error('Failed to convert blob to data URL'));
          return;
        }
        console.log(`Converted to data URL, length: ${dataURL.length}`);
        resolve(dataURL);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching audio:", error);
    throw error;
  }
}
