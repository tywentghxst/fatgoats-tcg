import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Camera, 
  Mic, 
  Timer, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  Play, 
  Square, 
  RotateCcw, 
  Upload, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { QuestItem } from '../data/questsData';
import { CardItem } from '../types';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ProofModalProps {
  quest: QuestItem;
  card?: CardItem;
  onClose: () => void;
  onVerified: (cardId: string) => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  quest,
  card,
  onClose,
  onVerified,
}) => {
  // State for different proof types
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [textLog, setTextLog] = useState('');
  
  // Timer state
  const totalSeconds = quest.timerDuration || 30;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Verification celebration state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timer interval effect
  useEffect(() => {
    let interval: number;
    if (timerRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerFinished(true);
            sound.playSparkle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // Handle Photo selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      sound.playSparkle();
    }
  };

  // Handle Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        sound.playSparkle();
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      sound.playCardFlip();
    } catch {
      alert('Microphone permission is required to record audio proof.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Check if proof requirement is satisfied
  const canSubmit = (): boolean => {
    switch (quest.proofType) {
      case 'photo':
        return Boolean(photoUrl);
      case 'timer':
        return timerFinished;
      case 'audio':
        return Boolean(audioUrl);
      case 'text':
        return textLog.trim().length >= 10;
      default:
        return false;
    }
  };

  const handleSubmitProof = () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    sound.playPackOpen();

    setTimeout(() => {
      setIsSubmitting(false);
      setIsVerifiedSuccess(true);
      sound.playSparkle();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#f59e0b', '#ec4899', '#10b981'],
      });

      // Save proof note to localStorage
      try {
        const key = `fatgoats_proof_${quest.cardId}`;
        const proofRecord = {
          questId: quest.id,
          proofType: quest.proofType,
          timestamp: new Date().toISOString(),
          textNote: textLog || undefined,
        };
        localStorage.setItem(key, JSON.stringify(proofRecord));
      } catch {
        // storage error
      }

      setTimeout(() => {
        onVerified(quest.cardId);
      }, 1600);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl"
      />

      {/* Main Dialog Window */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#09101d] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden z-10 my-auto p-5 sm:p-7 flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-4 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Proof of Quest Verification</span>
          </div>
          <h3 className="font-display font-black text-xl text-white">
            Prove You Completed: <span className="text-cyan-400">{quest.title}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Target Card: <strong className="text-amber-300">#{quest.cardNumber} {quest.cardTitle}</strong>
          </p>
        </div>

        {/* Challenge Instruction Card */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-4 text-left">
          <p className="text-xs sm:text-sm text-slate-200 font-medium">
            "{quest.instruction}"
          </p>
          <div className="mt-2 text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Requirement: {quest.proofPrompt}</span>
          </div>
        </div>

        {/* PROOF WIDGET AREA (DYNAMIC BASED ON PROOF TYPE) */}
        <div className="my-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center min-h-[160px] flex flex-col items-center justify-center">
          
          {/* TYPE 1: PHOTO PROOF */}
          {quest.proofType === 'photo' && (
            <div className="w-full">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              {!photoUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl p-6 cursor-pointer flex flex-col items-center justify-center transition-all bg-slate-900/40"
                >
                  <Camera className="w-10 h-10 text-cyan-400 mb-2" />
                  <p className="text-xs font-semibold text-white">
                    Tap to Snap or Upload Photo Proof
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Camera selfie or image of your challenge result
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/60 max-h-56 mx-auto">
                  <img src={photoUrl} alt="Challenge Proof" className="w-full h-full object-cover max-h-56" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Photo Attached
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-medium px-2 py-1 rounded-lg border border-white/20"
                  >
                    Retake Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TYPE 2: COUNTDOWN STOPWATCH TIMER */}
          {quest.proofType === 'timer' && (
            <div className="w-full flex flex-col items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className={`${timerFinished ? 'stroke-emerald-400' : 'stroke-cyan-400'} transition-all`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="301"
                    strokeDashoffset={301 - (301 * (totalSeconds - timeLeft)) / totalSeconds}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono font-black text-3xl text-white">
                    {timeLeft}s
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    {timerFinished ? 'DONE!' : 'HOLD'}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2 mt-4">
                {!timerFinished ? (
                  !timerRunning ? (
                    <button
                      onClick={() => setTimerRunning(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Verification Timer ({totalSeconds}s)
                    </button>
                  ) : (
                    <button
                      onClick={() => setTimerRunning(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs active:scale-95 transition"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Pause Timer
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                    <CheckCircle className="w-4 h-4" />
                    <span>Timer Completed! Challenge verified.</span>
                  </div>
                )}
                
                {timeLeft < totalSeconds && !timerFinished && (
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimeLeft(totalSeconds);
                    }}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TYPE 3: VOICE RECORDING SHOUT */}
          {quest.proofType === 'audio' && (
            <div className="w-full flex flex-col items-center justify-center py-2">
              {!audioUrl ? (
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-5 rounded-full transition-all active:scale-95 shadow-xl ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/40'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    }`}
                  >
                    {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                  </button>
                  <p className="text-xs font-semibold text-white mt-3">
                    {isRecording ? 'Recording your voice... Tap to Stop!' : 'Tap Mic to Record Shout / Rap'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Chant or speak into your microphone to verify
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                    <CheckCircle className="w-4 h-4" />
                    <span>Voice Proof Recorded!</span>
                  </div>
                  <audio src={audioUrl} controls className="w-full max-w-xs h-10 rounded-xl" />
                  <button
                    onClick={() => {
                      setAudioUrl(null);
                      audioChunksRef.current = [];
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Re-record audio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TYPE 4: TEXT FIELD REPORT */}
          {quest.proofType === 'text' && (
            <div className="w-full text-left">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Enter your field report (min 10 characters):
              </label>
              <textarea
                value={textLog}
                onChange={(e) => setTextLog(e.target.value)}
                placeholder="Describe exactly what happened when you completed the challenge..."
                className="w-full h-24 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>{textLog.trim().length >= 10 ? '✓ Ready to submit' : 'At least 10 characters required'}</span>
                <span>{textLog.length} chars</span>
              </div>
            </div>
          )}

        </div>

        {/* VERIFIED SUCCESS OVERLAY */}
        <AnimatePresence>
          {isVerifiedSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#09101d]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h4 className="font-display font-black text-2xl text-white">
                PROVED & VERIFIED!
              </h4>
              <p className="text-xs text-amber-300 font-bold uppercase tracking-wider mt-1">
                Official FatGoats Archive Seal Awarded
              </p>
              <p className="text-xs text-slate-300 mt-2 max-w-xs">
                Card <strong className="text-cyan-300">#{quest.cardNumber} {quest.cardTitle}</strong> has been added to your binder!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUBMIT BUTTON */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmitProof}
            disabled={!canSubmit() || isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
              canSubmit() && !isSubmitting
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying Proof...' : 'Submit Proof & Unlock Card'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
