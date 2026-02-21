import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function TemplateLibrary({ onSelectTemplate, isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(API_URL + '/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (templateId) => {
    setLoadingTemplate(true);
    try {
      const response = await fetch(`${API_URL}/api/templates/${templateId}`);
      const template = await response.json();
      setSelectedTemplate(template);
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.template);
      onClose();
      setSelectedTemplate(null);
    }
  };

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.category === filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl shadow-card max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#D6C9A8] dark:border-instrument-border">
          <div>
            <h2 className="text-lg font-semibold font-display text-slate-800 dark:text-white">Documentation Templates</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pre-built templates that meet coding requirements</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface rounded-lg"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Template List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#D6C9A8] dark:border-instrument-border flex flex-col max-h-[40vh] md:max-h-none">
            {/* Filter */}
            <div className="p-3 border-b border-[#D6C9A8] dark:border-instrument-border">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D6C9A8] dark:border-instrument-border rounded-lg bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthcare-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-healthcare-500 bg-healthcare-50 dark:bg-healthcare-900/20'
                          : 'border-[#D6C9A8] dark:border-instrument-border hover:border-healthcare-300 dark:hover:border-healthcare-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-sm text-slate-800 dark:text-white">
                          {template.name}
                        </span>
                        <span className="text-xs font-mono bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {template.cptCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {template.description}
                      </p>
                      <span className="inline-block text-xs text-healthcare-600 dark:text-healthcare-400 mt-1">
                        {template.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template Preview */}
          <div className="flex-1 flex flex-col">
            {loadingTemplate ? (
              <div className="flex items-center justify-center flex-1">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthcare-600"></div>
              </div>
            ) : selectedTemplate ? (
              <>
                <div className="p-4 border-b border-[#D6C9A8] dark:border-instrument-border">
                  <h3 className="font-medium text-slate-800 dark:text-white">{selectedTemplate.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    CPT Code: <span className="font-mono">{selectedTemplate.cptCode}</span>
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono bg-[#EDE6D3] dark:bg-instrument-bg p-4 rounded-lg">
                    {selectedTemplate.template}
                  </pre>
                </div>
                <div className="p-4 border-t border-[#D6C9A8] dark:border-instrument-border">
                  <button
                    onClick={handleUseTemplate}
                    className="w-full py-2 bg-healthcare-500 text-white rounded-lg hover:bg-healthcare-600 font-medium"
                  >
                    Use This Template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
