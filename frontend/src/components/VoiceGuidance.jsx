import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "./context/LanguageContext";
import "./VoiceGuidance.css";

const LANG_MAP = { en: "en-US", te: "te-IN", hi: "hi-IN" };

const VoiceGuidance = () => {
  const { language, t } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem("voiceGuidanceEnabled");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const selectedVoiceRef = useRef(null);
  const isEnabledRef = useRef(isEnabled);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  useEffect(() => {
    isEnabledRef.current = isEnabled;
    localStorage.setItem("voiceGuidanceEnabled", JSON.stringify(isEnabled));
  }, [isEnabled]);

  const findVoice = useCallback((lang, voices) => {
    const target = LANG_MAP[lang] || "en-US";
    const matches = voices.filter(v =>
      v.lang.toLowerCase().startsWith(target.toLowerCase())
    );
    return matches.find(v => v.default) || matches.find(v => v.localService) || matches[0] || null;
  }, []);

  useEffect(() => {
    if (!synth) return;

    const loadVoices = () => {
      const voices = synth.getVoices();
      const voice = findVoice(language, voices);
      selectedVoiceRef.current = voice;

      if (!voice && (language === "hi" || language === "te")) {
        const langName = language === "hi" ? "Hindi" : "Telugu";
        setVoiceError(`${langName} voice is not available in this browser/system.`);
      } else {
        setVoiceError("");
      }
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => { if (synth) synth.onvoiceschanged = null; };
  }, [synth, language, findVoice]);

  const speak = useCallback((text, priority = false) => {
    if (!synth || !isEnabledRef.current) return;
    if (priority) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || "en-US";
    if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synth.speak(utterance);
  }, [synth, language]);

  // Expose to window — always fresh via ref pattern
  useEffect(() => {
    window.voiceGuidance = {
      speak: (text, priority) => speak(text, priority),
      announceNavigation: (page) => speak(`${t("navigatingTo")} ${page}`, true),
      announceAction: (action) => speak(t(action) || action),
      announceError: (msg) => speak(`${t("errorOccurred")}. ${msg}`, true),
      announceSuccess: (msg) => speak(t(msg) || msg),
      isEnabled: () => isEnabledRef.current,
    };
  }, [speak, t]);

  // Welcome message on enable
  useEffect(() => {
    if (isEnabled) speak(t("welcomeMessage"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  if (!synth) return null;

  return (
    <div className="voice-guidance-container">
      <button
        className={`voice-button ${isEnabled ? "active" : ""}`}
        onClick={() => setIsEnabled(v => !v)}
        title={isEnabled ? "Voice Guidance Enabled" : "Enable Voice Guidance"}
      >
        <span className="voice-icon">🔊</span>
        {isSpeaking && <span className="voice-indicator" />}
      </button>

      {isEnabled && (
        <div className="voice-status">
          <small>🎙️ {t("voiceGuideActive")}</small>
        </div>
      )}
      {voiceError && (
        <div className="voice-error">
          <small>⚠️ {voiceError}</small>
        </div>
      )}
    </div>
  );
};

export default VoiceGuidance;
