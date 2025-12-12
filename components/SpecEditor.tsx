
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SPECS } from '../design_specs';
import { storageService, REF_KEY } from '../services/storageService';

interface SpecEditorProps {
    isOpen: boolean; // Controlled from outside
    onClose: () => void;
    // Removed old props that were for the floating button logic
}

const calculateDiffLines = (oldText: string, newText: string) => {
    // ... (Diff Logic unchanged) ...
    if (!oldText) oldText = "";
    if (!newText) newText = "";

    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const N = oldLines.length;
    const M = newLines.length;
    
    const dp = Array(N + 1).fill(0).map(() => Array(M + 1).fill(0));
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= M; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    let i = N, j = M;
    const diff: {type: ' ' | '+' | '-', text: string}[] = [];
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            diff.unshift({ type: ' ', text: oldLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: '+', text: newLines[j - 1] });
            j--;
        } else {
            diff.unshift({ type: '-', text: oldLines[i - 1] });
            i--;
        }
    }
    return diff;
};

const LiveVisualDiff: React.FC<{ original: string, current: string }> = ({ original, current }) => {
    // ... (LiveVisualDiff unchanged) ...
    const diffLines = useMemo(() => calculateDiffLines(original, current), [original, current]);
    const hasChanges = diffLines.some(l => l.type !== ' ');

    if (!hasChanges) {
        return (
            <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No changes detected vs Saved Reference.</p>
            </div>
        );
    }

    return (
        <div className="p-6 font-mono text-sm whitespace-pre-wrap">
            {diffLines.map((line, idx) => {
                let bgClass = '';
                let textClass = 'text-slate-300';
                
                if (line.type === '+') {
                    bgClass = 'bg-green-900/20';
                    textClass = 'text-green-400';
                } else if (line.type === '-') {
                    bgClass = 'bg-red-900/20';
                    textClass = 'text-red-400 line-through opacity-70';
                }

                return (
                    <div key={idx} className={`${bgClass} px-2 -mx-2`}>
                        <span className={`inline-block w-4 mr-2 opacity-50 select-none ${textClass}`}>{line.type}</span>
                        <span className={textClass}>{line.text}</span>
                    </div>
                );
            })}
        </div>
    );
};

const SpecEditor: React.FC<SpecEditorProps> = ({ isOpen, onClose }) => {
  // Removed internal isOpen state, controlled by prop
  
  // ... (State and logic unchanged) ...
  const [files, setFiles] = useState<Record<string, string>>(SPECS);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(SPECS)[0]);
  const [snapshots, setSnapshots] = useState<Record<string, string>>(SPECS);
  const [deletedFiles, setDeletedFiles] = useState<Set<string>>(new Set());
  
  const [diffOutput, setDiffOutput] = useState('');
  const [mode, setMode] = useState<'EDIT' | 'DIFF'>('EDIT');
  const [isChatOnly, setIsChatOnly] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string>("Init...");
  const [origin, setOrigin] = useState<string>(window.location.origin);
  const [isSyncScroll, setIsSyncScroll] = useState(true);
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<boolean>(false);

  const [viewState, setViewState] = useState<{ showEditor: boolean; showPreview: boolean }>(() => {
      const saved = localStorage.getItem('polyglot_spec_view');
      return saved ? JSON.parse(saved) : { showEditor: true, showPreview: true };
  });

  useEffect(() => {
      localStorage.setItem('polyglot_spec_view', JSON.stringify(viewState));
  }, [viewState]);

  useEffect(() => {
      if (isOpen) {
          if (window.location.origin !== origin) {
              setOrigin(window.location.origin);
              setDebugStatus("⚠️ ORIGIN CHANGED - DB RESET");
          }
          setFiles(SPECS);
          if (!Object.keys(SPECS).includes(activeFile)) setActiveFile(Object.keys(SPECS)[0]);

          storageService.loadSpecs().then(savedSnapshots => {
              if (savedSnapshots && typeof savedSnapshots === 'object' && Object.keys(savedSnapshots).length > 0) {
                  setSnapshots(savedSnapshots);
                  setDebugStatus(`Loaded (${Object.keys(savedSnapshots).length} files)`);
              } else {
                  setSnapshots(SPECS);
                  setDebugStatus("Storage Empty - Defaulting");
              }
          });
      }
  }, [isOpen]);

  const handleClose = () => {
      storageService.saveSpecs(files).then(() => {
          setSnapshots(files);
      });
      onClose(); // Call parent close
  };

  const toggleView = (view: 'showEditor' | 'showPreview') => {
      setViewState(prev => {
          const next = { ...prev, [view]: !prev[view] };
          if (!next.showEditor && !next.showPreview) return prev;
          return next;
      });
  };

  const handleContentChange = (newContent: string) => {
      const newFiles = { ...files, [activeFile]: newContent };
      setFiles(newFiles);
  };
  
  // ... (File CRUD methods unchanged) ...
  const confirmAddFile = () => {
      if (newFileName && !files[newFileName]) {
          setFiles(prev => ({ ...prev, [newFileName]: "" }));
          setSnapshots(prev => ({ ...prev, [newFileName]: "" }));
          setActiveFile(newFileName);
          setMode('EDIT');
          setIsAdding(false);
          setNewFileName('');
      } else if (files[newFileName]) {
          alert("File already exists");
      }
  };

  const handleDeleteFile = (fileName: string) => {
      if (Object.keys(files).length <= 1) {
          alert("Cannot delete the last file.");
          return;
      }
      if (confirm(`Delete '${fileName}'?\n\nNOTE: This will instruct the AI to rename the file to 'DELETED_${fileName}' and clear content, as AI Studio cannot physically delete files.`)) {
          const newFiles = { ...files };
          delete newFiles[fileName];
          setFiles(newFiles);
          setDeletedFiles(prev => new Set(prev).add(fileName));
          if (activeFile === fileName) {
              setActiveFile(Object.keys(newFiles)[0]);
          }
      }
  };

  const startRename = () => {
      setIsRenaming(true);
      setRenameValue(activeFile);
  };

  const finishRename = () => {
      if (renameValue && renameValue !== activeFile && !files[renameValue]) {
          const content = files[activeFile];
          const newFiles = { ...files };
          delete newFiles[activeFile];
          newFiles[renameValue] = content;
          setFiles(newFiles);

          const newSnapshots = { ...snapshots };
          if (newSnapshots[activeFile]) {
              const snapContent = newSnapshots[activeFile];
              delete newSnapshots[activeFile];
              newSnapshots[renameValue] = snapContent;
              setSnapshots(newSnapshots);
          }
          
          if (deletedFiles.has(activeFile)) {
              const newDeleted = new Set(deletedFiles);
              newDeleted.delete(activeFile);
              newDeleted.add(renameValue);
              setDeletedFiles(newDeleted);
          }
          
          setActiveFile(renameValue);
      }
      setIsRenaming(false);
  };
  
  const handleEditorScroll = () => {
      if (!isSyncScroll || !editorRef.current || !previewRef.current) return;
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      const editor = editorRef.current;
      const preview = previewRef.current;
      const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
      setTimeout(() => { isScrollingRef.current = false; }, 50);
  };

  const handlePreviewScroll = () => {
      if (!isSyncScroll || !editorRef.current || !previewRef.current) return;
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      const editor = editorRef.current;
      const preview = previewRef.current;
      const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
      setTimeout(() => { isScrollingRef.current = false; }, 50);
  };

  const hasUnsavedChanges = (fileName: string) => {
      const current = files[fileName] || "";
      const ref = snapshots[fileName] || "";
      return current !== ref;
  };

  const downloadSpecs = () => {
      const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
      const filename = `polyglot_restore_point_${timestamp}.md`;
      const combined = Object.entries(files).map(([name, content]) => `--- START OF ${name} ---\n${content}\n--- END OF ${name} ---`).join('\n\n');
      const blob = new Blob([combined], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const importReference = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (text) {
              const newSnapshots: Record<string, string> = {};
              const parts = text.split(/--- START OF (.*?) ---\n/);
              for (let i = 1; i < parts.length; i += 2) {
                  const name = parts[i];
                  let content = parts[i + 1];
                  const endMarker = `\n--- END OF ${name} ---`;
                  if (content.endsWith(endMarker)) {
                      content = content.substring(0, content.length - endMarker.length);
                  } else if (content.includes(endMarker)) {
                       content = content.split(endMarker)[0];
                  }
                  newSnapshots[name] = content;
              }
              
              if (Object.keys(newSnapshots).length > 0) {
                  setSnapshots(newSnapshots);
                  await storageService.saveSpecs(newSnapshots);
                  setDebugStatus(`Imported Ref (${Object.keys(newSnapshots).length} files)`);
                  alert("Reference loaded! Check the Diff view.");
              } else {
                  alert("Could not parse file format.");
              }
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const triggerImport = () => {
      fileInputRef.current?.click();
  };

  const getDiffForFile = (fileName: string) => {
      const oldText = snapshots[fileName] || "";
      const newText = files[fileName] || "";
      
      if (oldText === newText) return null;

      const diff = calculateDiffLines(oldText, newText);
      const CONTEXT = 3;
      const hunks: string[] = [];
      let currentHunk: string[] = [];
      let hunkHasChanges = false;
      let lastChangeIndex = -999;

      for (let k = 0; k < diff.length; k++) {
          const isChange = diff[k].type !== ' ';
          if (isChange) {
              if (lastChangeIndex !== -999 && k - lastChangeIndex > CONTEXT * 2 + 1) {
                  hunks.push(currentHunk.join('\n'));
                  hunks.push('... [Unchanged Section] ...');
                  currentHunk = [];
                  hunkHasChanges = false;
              }
              if (currentHunk.length === 0) {
                  const start = Math.max(0, k - CONTEXT);
                  for (let c = start; c < k; c++) {
                      currentHunk.push(`${diff[c].type} ${diff[c].text}`);
                  }
              }
              currentHunk.push(`${diff[k].type} ${diff[k].text}`);
              hunkHasChanges = true;
              lastChangeIndex = k;
          } else {
              if (hunkHasChanges && k - lastChangeIndex <= CONTEXT) {
                  currentHunk.push(`${diff[k].type} ${diff[k].text}`);
              }
          }
      }
      if (hunkHasChanges) hunks.push(currentHunk.join('\n'));
      
      return `Här är uppdateringar till specifikationen (${fileName}):\n\n` + hunks.join('\n');
  };

  const generateDiffPrompt = () => {
      const allDiffs: string[] = [];
      
      if (deletedFiles.size > 0) {
          const deletions = Array.from(deletedFiles).map(f => 
              `- DELETE FILE: ${f} (Note: Please rename to "_DELETED_${f}" and clear content, as files cannot be fully removed.)`
          ).join('\n');
          const delInstruction = `Följande filer har raderats från projektet:\n${deletions}\n\nGlöm inte att uppdatera "design_specs.ts" för att ta bort importen.`;
          allDiffs.push(delInstruction);
      }

      Object.keys(files).sort().forEach(fileName => {
          const diff = getDiffForFile(fileName);
          if (diff) allDiffs.push(diff);
      });
      
      const newFiles = Object.keys(files).filter(f => !snapshots[f]);
      if (newFiles.length > 0) {
           const newInstructions = newFiles.map(f => `- NEW FILE: ${f} (Remember to add export in design_specs.ts)`).join('\n');
           allDiffs.push(`Följande NYA filer har skapats:\n${newInstructions}`);
      }

      if (allDiffs.length === 0) {
          setDiffOutput("Inga ändringar hittades i någon fil jämfört med referensen.");
          setMode('DIFF');
          return;
      }

      let output = allDiffs.join('\n\n');
      
      if (isChatOnly) {
          output += "\n\nOBS: Vi diskuterar enbart dessa ändringar i specifikationen just nu. Implementera ingen ny funktionskod i appen, uppdatera endast designdokumentet.";
      } else {
          output += "\n\nVar god uppdatera applikationen baserat på dessa ändringar.";
      }
      
      setDiffOutput(output);
      setMode('DIFF');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(diffOutput);
    
    const newSnapshots = { ...files };
    storageService.saveSpecs(newSnapshots).then(() => {
         setSnapshots(newSnapshots);
         setDebugStatus(`Saved (${Object.keys(newSnapshots).length} files)`);
         setDeletedFiles(new Set());
    });

    downloadSpecs();
    alert("Diff copied!\n\nBackup file downloaded automatically.\nUse 'Import Ref' if the app resets.");
  };

  const syncRefToCurrent = () => {
      const newSnapshots = { ...files };
      setSnapshots(newSnapshots);
      storageService.saveSpecs(newSnapshots);
      setDebugStatus("Restore Point Saved");
      setDeletedFiles(new Set());
      downloadSpecs();
      alert("Restore Point Created!\n\nReference updated and backup file downloaded.");
  };

  const ragFiles = Object.keys(files).filter(f => f.startsWith('rag_') || f.startsWith('context/'));
  const sysFiles = Object.keys(files).filter(f => !ragFiles.includes(f));

  // ... (Render Logic) ...
  const renderFileList = (list: string[], title: string, colorClass: string) => (
      <div className="mb-4">
          <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex justify-between items-center ${colorClass}`}>
              <span>{title}</span>
              {title === "Context / RAG" && (
                   <button onClick={() => { setIsAdding(true); setNewFileName('rag_new.md'); }} className="hover:text-white px-1" title="Add RAG File">+</button>
              )}
          </div>
          {list.sort().map(fileName => {
              const isModified = hasUnsavedChanges(fileName);
              return (
                  <div key={fileName} className="group relative flex items-center">
                      <button
                          onClick={() => { setActiveFile(fileName); setMode('EDIT'); setIsRenaming(false); }}
                          className={`flex-1 px-4 py-2 text-left text-xs font-medium transition-colors border-l-2 flex items-center justify-between ${
                              activeFile === fileName 
                              ? 'bg-slate-800/50 text-cyan-400 border-cyan-500' 
                              : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
                          }`}
                      >
                          <span className="truncate pr-8">{fileName}</span>
                          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-2 shrink-0" title="Has changes"></span>}
                      </button>
                      {(activeFile === fileName) && (
                          <div className="absolute right-1 flex gap-1 bg-slate-900/80 rounded px-1">
                              <button onClick={(e) => { e.stopPropagation(); startRename(); }} className="text-slate-400 hover:text-white p-1" title="Rename">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(fileName); }} className="text-slate-400 hover:text-red-400 p-1" title="Delete">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>
  );

  // Removed Floating Button logic from here
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Editor Modal Logic (Unchanged) */}
          <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* ... rest of editor ... */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400">Plan & Specs</span>
                    <button onClick={syncRefToCurrent} className="flex items-center gap-1 text-xs text-green-400 font-bold px-3 py-1 bg-green-900/20 border border-green-700/50 rounded hover:bg-green-900/40 transition-colors" title="Save current state as Restore Point">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Create Restore Point
                    </button>
                  </h2>
                  {mode === 'EDIT' && (
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button onClick={() => toggleView('showEditor')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewState.showEditor ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Edit</button>
                            <div className="w-px bg-slate-700 mx-1 h-4 self-center"></div>
                            <button onClick={() => toggleView('showPreview')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewState.showPreview ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Diff</button>
                        </div>
                        {viewState.showEditor && viewState.showPreview && (
                             <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                                <input type="checkbox" checked={isSyncScroll} onChange={(e) => setIsSyncScroll(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-600" />
                                <span className="text-[10px] text-slate-400">Sync Scroll</span>
                            </label>
                        )}
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".md" onChange={importReference} />
                  <button onClick={triggerImport} className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Import Ref
                  </button>
                  <button onClick={downloadSpecs} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors" title="Export All">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                  <button onClick={handleClose} className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded-lg transition-colors">Close</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative flex">
                <div className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col">
                    <div className="p-3 bg-slate-900/50 flex justify-between items-center border-b border-slate-800">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Browser</span>
                         <button onClick={() => { setIsAdding(true); setNewFileName(''); }} className="hover:text-cyan-400 text-slate-400 p-1" title="Add File">+</button>
                    </div>
                    {isAdding && (
                        <div className="px-2 py-2 bg-slate-800/50 border-l-2 border-green-500 flex gap-1 shrink-0 animate-fade-in">
                             <input 
                                autoFocus
                                className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white flex-1 min-w-0"
                                placeholder="name.md"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') confirmAddFile();
                                    if(e.key === 'Escape') setIsAdding(false);
                                }}
                             />
                             <button onClick={confirmAddFile} className="text-green-500 hover:text-green-400 px-1">✓</button>
                             <button onClick={() => setIsAdding(false)} className="text-red-500 hover:text-red-400 px-1">✕</button>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto py-2">
                        {renderFileList(sysFiles, "System Specs", "text-slate-500")}
                        {renderFileList(ragFiles, "Context / RAG", "text-amber-500")}
                    </div>
                    <div className="mt-auto p-4 border-t border-slate-800 shrink-0">
                        <div className="text-[9px] text-slate-600 truncate" title={origin}>
                           Origin: {origin.replace('https://', '')}
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {mode === 'EDIT' && (
                        <div className="flex h-full w-full">
                            {viewState.showEditor && (
                                <div className={`flex flex-col h-full border-r border-slate-700/50 ${viewState.showPreview ? 'w-1/2' : 'w-full'}`}>
                                    {isRenaming ? (
                                        <div className="p-4 border-b border-slate-800 flex gap-2">
                                            <input 
                                                className="bg-slate-800 border border-slate-600 rounded text-sm px-2 py-1 text-white flex-1"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                            />
                                            <button onClick={finishRename} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Save</button>
                                            <button onClick={() => setIsRenaming(false)} className="bg-slate-700 text-white px-3 py-1 rounded text-xs">Cancel</button>
                                        </div>
                                    ) : null}
                                    <textarea
                                        ref={editorRef}
                                        onScroll={handleEditorScroll}
                                        value={files[activeFile]}
                                        onChange={(e) => handleContentChange(e.target.value)}
                                        className="flex-1 w-full bg-slate-950 text-slate-300 font-mono text-sm p-6 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 leading-relaxed"
                                        spellCheck={false}
                                        placeholder="Select a file..."
                                    />
                                </div>
                            )}
                            {viewState.showPreview && (
                                <div 
                                    ref={previewRef}
                                    onScroll={handlePreviewScroll}
                                    className={`flex flex-col h-full bg-slate-900 overflow-auto ${viewState.showEditor ? 'w-1/2 border-l border-slate-800' : 'w-full'}`}
                                >
                                    <LiveVisualDiff original={snapshots[activeFile] || ""} current={files[activeFile] || ""} />
                                </div>
                            )}
                        </div>
                    )}
                    {mode === 'DIFF' && (
                        <div className="flex-1 w-full bg-slate-950 p-6 overflow-auto">
                            <pre className="text-sm font-mono whitespace-pre-wrap">
                                {diffOutput.split('\n').map((line, i) => (
                                    <div key={i} className={`${line.startsWith('+') ? 'text-green-400 bg-green-900/10' : line.startsWith('-') ? 'text-red-400 bg-red-900/10' : 'text-slate-500'}`}>
                                        {line}
                                    </div>
                                ))}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                      <div className="text-xs text-slate-500">
                        {activeFile} {mode === 'DIFF' ? '(Review)' : ''}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5 flex gap-2">
                         <span>Status: {debugStatus}</span>
                      </div>
                  </div>
                  {mode === 'EDIT' && (
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={isChatOnly} onChange={(e) => setIsChatOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-600" />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200">Chat only</span>
                      </label>
                  )}
              </div>
              <div className="flex gap-2">
                {mode === 'DIFF' ? (
                    <>
                        <button onClick={() => setMode('EDIT')} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">Back</button>
                        <button onClick={copyToClipboard} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2">
                            Copy Diff & Save Ref
                        </button>
                    </>
                ) : (
                    <button onClick={generateDiffPrompt} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-cyan-900/20">
                        Preview Diff (All Files)
                    </button>
                )}
              </div>
            </div>
          </div>
    </div>
  );
};

export default SpecEditor;
