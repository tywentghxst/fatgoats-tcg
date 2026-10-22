import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, UploadCloud, FileArchive, CheckCircle, AlertCircle, Sparkles, FolderArchive } from 'lucide-react';
import { parseZipArchive } from '../utils/zipParser';
import { CardItem } from '../types';
import { sound } from '../utils/audio';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ZipUploaderModalProps {
  onClose: () => void;
  onApplyNewCards: (newCards: CardItem[], cardBackUrl: string) => void;
}

export const ZipUploaderModal: React.FC<ZipUploaderModalProps> = ({
  onClose,
  onApplyNewCards,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFilename, setCurrentFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{ cards: CardItem[]; cardBackUrl: string } | null>(null);

  // Lock background body scroll
  useBodyScrollLock(true);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('Please select a valid .zip file archive containing card artwork.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setProgress(5);
      setCurrentFilename('Reading archive headers...');

      const result = await parseZipArchive(file, (pct, fname) => {
        setProgress(pct);
        setCurrentFilename(fname);
      });

      setParsedResult({
        cards: result.cards,
        cardBackUrl: result.cardBackUrl,
      });
      sound.playSparkle();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse ZIP archive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedResult) {
      onApplyNewCards(parsedResult.cards, parsedResult.cardBackUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain touch-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-2xl touch-none"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-[#0b1322] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 z-10 my-auto shadow-2xl shadow-cyan-950/60 overscroll-contain"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-2">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Client-Side In-Memory ZIP Ingestion</span>
          </div>
          <h2 className="font-display text-2xl font-black text-white">
            Load Custom <span className="text-cyan-400">Card Pack Archive</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Note: All <strong className="text-cyan-300">36 FatGoats cards</strong> and the <strong className="text-amber-300">Celestial Goat Card Back</strong> from your 57MB zip are already loaded and ready in the gallery! You can also drop any new zip or expansion file here anytime without size limits.
          </p>
        </div>

        {/* Drag & Drop Box */}
        {!parsedResult ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                : 'border-slate-700 hover:border-cyan-500/60 bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />

            <UploadCloud className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">
              Drag & Drop your <span className="text-cyan-300">.zip archive</span> here, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports any size archive (57MB, 100MB+) • Processed 100% locally in your browser memory
            </p>
          </div>
        ) : (
          /* Parsed Summary Box */
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-left space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>ZIP Archive Extracted Successfully!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Total Cards Parsed:</span>
                <p className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                  {parsedResult.cards.length} Cards
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Universal Card Back:</span>
                <p className="text-xs font-semibold text-amber-300 mt-1 truncate">
                  {parsedResult.cardBackUrl ? '✓ Found Celestial Back' : 'Default Assigned'}
                </p>
              </div>
            </div>

            {/* Preview of first 4 cards */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto">
              {parsedResult.cards.slice(0, 5).map((c) => (
                <div key={c.id} className="w-14 aspect-[731/1024] rounded-lg overflow-hidden border border-slate-700 shrink-0">
                  <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                </div>
              ))}
              {parsedResult.cards.length > 5 && (
                <span className="text-xs text-slate-400 pl-2">+{parsedResult.cards.length - 5} more</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setParsedResult(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Upload Different File
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition"
              >
                Apply to Active Collection
              </button>
            </div>
          </div>
        )}

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-mono">
              <span className="truncate pr-2">{currentFilename}</span>
              <span className="text-cyan-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
