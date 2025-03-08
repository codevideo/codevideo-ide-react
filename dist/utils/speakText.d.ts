/**
 * Speaks the given text, canceling any currently playing speech first
 * @param text The text to speak
 * @returns A promise that resolves when speech is finished
 */
export declare const speakText: (text: string, volume: number) => Promise<void>;
/**
 * Immediately stops any ongoing speech synthesis
 */
export declare const stopSpeaking: () => void;
/**
 * Checks if speech synthesis is currently active
 * @returns True if something is being spoken, false otherwise
 */
export declare const isSpeaking: () => boolean;
