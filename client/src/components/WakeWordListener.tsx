import { useEffect, useRef } from "react";

type RecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;

export function WakeWordListener({ enabled, onWakeWord, onUnsupported }: {
  enabled: boolean;
  onWakeWord: () => void;
  onUnsupported: () => void;
}) {
  const callbackRef = useRef(onWakeWord);
  callbackRef.current = onWakeWord;

  useEffect(() => {
    if (!enabled) return;
    const browserWindow = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      onUnsupported();
      return;
    }

    let disposed = false;
    let restartTimer: number | undefined;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript?.toLowerCase() ?? "";
      if (/\b(hey|hi)\s+jarvis\b/.test(transcript)) {
        recognition.stop();
        callbackRef.current();
      }
    };
    recognition.onerror = () => undefined;
    recognition.onend = () => {
      if (!disposed) restartTimer = window.setTimeout(() => {
        try { recognition.start(); } catch { /* Recognition may already be restarting. */ }
      }, 450);
    };
    try { recognition.start(); } catch { onUnsupported(); }
    return () => {
      disposed = true;
      if (restartTimer) window.clearTimeout(restartTimer);
      recognition.stop();
    };
  }, [enabled, onUnsupported]);

  return null;
}
