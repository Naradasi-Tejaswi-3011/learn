import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Zap, BookOpen } from 'lucide-react';

const NoteSummarizer = ({ onClose }) => {
  const [documentText, setDocumentText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const fileInputRef = useRef(null);
  const documentContentRef = useRef(null);

  // Check for existing selection on mount
  useEffect(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    }

    // Try to access PDF content from the study room
    const accessCurrentPdf = async () => {
      if (selection && selection.toString().trim().length > 0) {
        return;
      }

      try {
        setIsLoading(true);
        const textLayerContent = document.querySelector('.textLayer');
        if (textLayerContent) {
          const existingText = textLayerContent.textContent || "";
          if (existingText.trim().length > 0) {
            setDocumentText(existingText);
            
            if (documentContentRef.current) {
              documentContentRef.current.innerHTML = '';
              const paragraphs = existingText.split(/\n\s*\n|\r\n\s*\r\n|\r\s*\r/);
              paragraphs.forEach(paragraph => {
                if (paragraph.trim().length > 0) {
                  const para = document.createElement('p');
                  para.className = 'mb-3';
                  para.textContent = paragraph.trim();
                  documentContentRef.current.appendChild(para);
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error accessing current PDF content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    accessCurrentPdf();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    if (documentContentRef.current) {
      documentContentRef.current.innerHTML = '';
    }

    const fileType = file.type;

    if (fileType === 'application/pdf') {
      // Use the local pdfjs-dist package
      try {
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source with multiple fallbacks
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          try {
            // Try to use the version-specific worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          } catch (e) {
            // Fallback to a stable version
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
          }
        }

        // Store reference for processPDF function
        window.pdfjsLib = pdfjsLib;
        await processPDF(file);
      } catch (error) {
        console.error('Error loading PDF.js:', error);
        alert('Error loading PDF processor. Please try again.');
        setIsLoading(false);
      }
    } else if (fileType === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setDocumentText(text);
        if (documentContentRef.current) {
          const pre = document.createElement('pre');
          pre.className = 'whitespace-pre-wrap';
          pre.textContent = text;
          documentContentRef.current.appendChild(pre);
        }
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else {
      alert("Unsupported file type. Please upload a PDF or TXT file.");
      setIsLoading(false);
    }
  };

  const processPDF = async (file) => {
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      // Create a copy of the ArrayBuffer to prevent detachment
      const arrayBuffer = this.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      const copiedArray = uint8Array.slice();

      try {
        const pdf = await window.pdfjsLib.getDocument({ data: copiedArray }).promise;
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + ' ';

          if (documentContentRef.current) {
            const pageElement = document.createElement('div');
            pageElement.className = 'pdf-page mb-4 p-3 border border-gray-200 rounded';
            pageElement.innerHTML = `<div class="text-sm font-medium text-gray-600 mb-2">Page ${pageNum}</div><div>${pageText}</div>`;
            documentContentRef.current.appendChild(pageElement);
          }
        }

        setDocumentText(fullText);
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing PDF:', error);
        setIsLoading(false);
        alert("Error processing PDF: " + error.message);
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  const summarizeSelectedText = () => {
    const selection = window.getSelection().toString().trim();
    const textToSummarize = selection || selectedText;

    if (!textToSummarize) {
      alert("Please select some text to summarize.");
      return;
    }

    if (documentContentRef.current && textToSummarize.length > 0) {
      if (!documentText) {
        documentContentRef.current.innerHTML = '';
      }

      const selectionElement = document.createElement('div');
      selectionElement.className = 'selected-text bg-yellow-50 p-3 border border-yellow-200 rounded mb-3';
      
      const header = document.createElement('div');
      header.className = 'text-sm font-medium text-gray-700 mb-2';
      header.textContent = 'Selected Text:';
      
      const content = document.createElement('div');
      content.textContent = textToSummarize;
      
      selectionElement.appendChild(header);
      selectionElement.appendChild(content);

      if (documentContentRef.current.firstChild) {
        documentContentRef.current.insertBefore(selectionElement, documentContentRef.current.firstChild);
      } else {
        documentContentRef.current.appendChild(selectionElement);
      }
    }

    if (selection) {
      setSelectedText(selection);
    }

    const generatedSummary = generateSummary(textToSummarize);
    setSummary(generatedSummary);
  };

  const summarizeAllText = () => {
    if (!documentText) {
      alert("Please upload a document first.");
      return;
    }

    const generatedSummary = generateSummary(documentText);
    setSummary(generatedSummary);
  };

  // Simple extractive summarization
  const generateSummary = (text) => {
    const sentences = text.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");

    if (sentences.length <= 3) {
      return text;
    }

    // Calculate word frequency
    const wordFrequency = {};
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      words.forEach(word => {
        if (word.length > 3) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    // Score sentences
    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      let score = 0;
      words.forEach(word => {
        if (word.length > 3) {
          score += wordFrequency[word] || 0;
        }
      });
      return { sentence, score };
    });

    // Get top 30% of sentences
    sentenceScores.sort((a, b) => b.score - a.score);
    const numSentencesToKeep = Math.max(3, Math.ceil(sentences.length * 0.3));
    const topSentences = sentenceScores.slice(0, numSentencesToKeep);

    // Sort back to original order
    const originalOrder = [];
    sentences.forEach((sentence, index) => {
      topSentences.forEach(item => {
        if (item.sentence === sentence) {
          originalOrder.push({ index, sentence });
        }
      });
    });

    originalOrder.sort((a, b) => a.index - b.index);
    return originalOrder.map(item => item.sentence).join("\n\n");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Notes Summarizer</h2>
              <p className="text-sm text-green-100">Extract key insights from your documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Document */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => fileInputRef.current.click()}
                className={`w-full flex items-center justify-center space-x-2 ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-4 py-2 rounded-lg transition-colors`}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                <span>{isLoading ? 'Processing...' : 'Upload File (PDF, TXT)'}</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              {selectedText && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    Text selection detected! You can summarize it directly.
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Document Content</h3>
              
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading document...</span>
                </div>
              )}

              {!isLoading && !documentText && selectedText && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Selected Text:</h4>
                  <p className="text-blue-700">{selectedText}</p>
                </div>
              )}

              <div ref={documentContentRef} className="prose max-w-none text-sm"></div>
            </div>
          </div>

          {/* Right Panel - Summary */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={summarizeSelectedText}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  <span>Summarize Selected Text</span>
                </button>
                
                <button
                  onClick={summarizeAllText}
                  className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Summarize All Text</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
              
              {summary ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="whitespace-pre-wrap text-gray-800">{summary}</div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Upload a document or select text to generate a summary</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteSummarizer;
