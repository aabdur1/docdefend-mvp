import { useState, useRef, useEffect, useCallback } from 'react';
import sampleNotes from '../data/sampleNotes.json';
import FileUploader from './FileUploader';

export default function NoteSelector({ value, onChange, onNoteSwitch }) {
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [inputMethod, setInputMethod] = useState('sample'); // 'sample', 'upload', 'manual'
  const tabContainerRef = useRef(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (!tabContainerRef.current) return;
    const activeBtn = tabContainerRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setTabIndicator({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, []);

  useEffect(() => {
    updateIndicator();
  }, [inputMethod, updateIndicator]);

  // Recalculate on resize
  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleNoteSelect = (e) => {
    const noteId = e.target.value;
    setSelectedNoteId(noteId);

    if (noteId) {
      const selectedNote = sampleNotes.find((n) => n.id === noteId);
      if (selectedNote) {
        onChange(selectedNote.note);
        onNoteSwitch?.();
      }
    }
  };

  const handleFileContent = (content) => {
    onChange(content);
    onNoteSwitch?.();
    setSelectedNoteId(''); // Clear sample selection when file is uploaded
  };

  const selectedNote = sampleNotes.find((n) => n.id === selectedNoteId);

  return (
    <div className="space-y-4">
      {/* Input Method Tabs */}
      <div ref={tabContainerRef} role="tablist" aria-label="Note input method" className="relative flex gap-1 p-1 bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-xl">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 bg-healthcare-500 dark:bg-trace-glow rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
          style={{ left: tabIndicator.left, width: tabIndicator.width }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={inputMethod === 'sample'}
          data-active={inputMethod === 'sample'}
          onClick={() => setInputMethod('sample')}
          className={`relative z-10 flex-1 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
            inputMethod === 'sample'
              ? 'text-white'
              : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Sample</span> Notes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inputMethod === 'upload'}
          data-active={inputMethod === 'upload'}
          onClick={() => setInputMethod('upload')}
          className={`relative z-10 flex-1 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
            inputMethod === 'upload'
              ? 'text-white'
              : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inputMethod === 'manual'}
          data-active={inputMethod === 'manual'}
          onClick={() => setInputMethod('manual')}
          className={`relative z-10 flex-1 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
            inputMethod === 'manual'
              ? 'text-white'
              : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Paste
        </button>
      </div>

      {/* Sample Notes Tab */}
      {inputMethod === 'sample' && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select a Sample Note
            </label>
            <div className="relative">
              <select
                value={selectedNoteId}
                onChange={handleNoteSelect}
                aria-label="Select a sample clinical note"
                className="w-full px-4 py-3 border border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500 bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white shadow-sm appearance-none cursor-pointer transition-shadow duration-200 hover:shadow-md"
              >
                <option value="">-- Choose a sample note --</option>
                {sampleNotes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {selectedNote && (
            <div className="bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-xl p-4 text-sm border border-[#D6C9A8]/50 dark:border-instrument-border/50 shadow-sm animate-scaleIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-600 dark:text-slate-300">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Visit Type</span>
                  <span className="font-medium">{selectedNote.visitType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Provider</span>
                  <span className="font-medium">{selectedNote.providerType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Summary</span>
                  <span className="font-medium">{selectedNote.patientSummary}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload File Tab */}
      {inputMethod === 'upload' && (
        <div className="space-y-4">
          <FileUploader onContentExtracted={handleFileContent} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload clinical notes exported from your EHR. Supports CCDA/CCD (XML), PDF, and plain text formats.
          </p>
        </div>
      )}

      {/* Manual Entry Tab */}
      {inputMethod === 'manual' && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste or type your clinical note directly in the text area below.
        </p>
      )}

      {/* Note Text Area (always visible) */}
      <div className="animate-fadeInUp">
        <label className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-healthcare-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Clinical Note
          </span>
          {value && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal px-2 py-1 bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-full">
              {value.length.toLocaleString()} characters
            </span>
          )}
        </label>
        <div className="relative group focus-glow-wrap">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            aria-label="Clinical note text"
            className="relative z-10 w-full px-4 py-3 border border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500 font-clinical text-sm bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white shadow-sm transition-all duration-300 group-hover:shadow-md focus:shadow-lg focus:shadow-healthcare-500/10 resize-none"
            placeholder="Clinical note content will appear here..."
          />
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-instrument-bg-raised/80 px-2 py-1 rounded">
              Scroll to view more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
