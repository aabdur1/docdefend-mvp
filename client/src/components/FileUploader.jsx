import { useState, useRef } from 'react';
import { useApiKey } from '../context/ApiKeyContext';
import { API_URL } from '../config';

export default function FileUploader({ onContentExtracted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { apiKey } = useApiKey();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = {};
      if (apiKey) headers['x-api-key'] = apiKey;

      const response = await fetch(API_URL + '/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }

      setUploadResult({
        filename: data.filename,
        fileType: data.fileType,
        contentLength: data.contentLength,
      });

      // Pass extracted content to parent
      onContentExtracted(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 group
          ${isDragging
            ? 'border-healthcare-500 bg-[#EDE6D3] dark:bg-healthcare-900/20 scale-[1.02]'
            : 'border-[#D6C9A8] dark:border-instrument-border hover:border-healthcare-400 dark:hover:border-healthcare-500 hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface'
          }
          ${isUploading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-20 h-20 bg-trace rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-healthcare-500 rounded-full translate-x-1/2 translate-y-1/2 group-hover:scale-150 transition-transform duration-700 delay-75"></div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xml,.ccd,.ccda,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Drop hint overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-semibold text-healthcare-600 dark:text-trace-glow bg-white/80 dark:bg-instrument-bg-raised/90 px-4 py-2 rounded-xl shadow-lg animate-scaleIn">
              Drop to upload
            </span>
          </div>
        )}

        {isUploading ? (
          <div className="flex flex-col items-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-healthcare-500 flex items-center justify-center mb-3 shadow-lg animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Processing file...</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Extracting clinical data</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EDE6D3] dark:bg-instrument-bg-surface flex items-center justify-center mb-3 shadow-inner group-hover:bg-[#E5DBBF] dark:group-hover:bg-healthcare-900/30 transition-colors duration-300">
              <svg
                className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-healthcare-500 dark:group-hover:text-healthcare-400 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-healthcare-600 dark:group-hover:text-healthcare-400 transition-colors">
              Drop a file here or click to upload
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-500 dark:text-slate-400 rounded">PDF</span>
              <span className="px-2 py-0.5 text-xs bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-500 dark:text-slate-400 rounded">CCDA/CCD</span>
              <span className="px-2 py-0.5 text-xs bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-500 dark:text-slate-400 rounded">TXT</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {uploadResult && (
        <div className="bg-healthcare-50 dark:bg-healthcare-900/20 border border-healthcare-200 dark:border-healthcare-800/50 rounded-xl p-4 flex items-start gap-3 animate-scaleIn shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-healthcare-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-sm flex-1">
            <p className="font-semibold text-slate-800 dark:text-white">
              {uploadResult.filename}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs font-medium bg-healthcare-100 dark:bg-healthcare-900/30 text-healthcare-500 dark:text-trace rounded-full">
                {uploadResult.fileType}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {uploadResult.contentLength.toLocaleString()} characters extracted
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
