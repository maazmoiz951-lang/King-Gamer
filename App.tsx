
import React, { useState, useRef, useEffect } from 'react';
import { processImage } from './services/geminiService';
import { GeneratedImage, AppState, AspectRatio, STYLES } from './types';
import Button from './components/Button';
import HistoryCard from './components/HistoryCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    prompt: '',
    selectedStyle: 'none',
    selectedRatio: '1:1',
    isGenerating: false,
    currentImage: null,
    history: [],
    error: null,
    isEditing: false,
  });

  const [uploadFile, setUploadFile] = useState<{data: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadFile({
          data: reader.result as string,
          type: file.type
        });
        setState(prev => ({ ...prev, currentImage: reader.result as string, error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!state.prompt.trim() && !uploadFile) {
      setState(prev => ({ ...prev, error: "Please enter a prompt or upload an image." }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    const finalPrompt = state.selectedStyle !== 'none' 
      ? `${state.prompt}. Style: ${STYLES.find(s => s.id === state.selectedStyle)?.prompt}`
      : state.prompt;

    try {
      const resultUrl = await processImage(
        finalPrompt,
        state.selectedRatio,
        uploadFile?.data,
        uploadFile?.type
      );

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: resultUrl,
        prompt: state.prompt || "Image Edit",
        timestamp: Date.now(),
        type: uploadFile ? 'edit' : 'generation',
        aspectRatio: state.selectedRatio
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentImage: resultUrl,
        history: [newImage, ...prev.history],
        prompt: uploadFile ? '' : prev.prompt,
        isEditing: false
      }));
      
      setUploadFile(null);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || "Something went wrong."
      }));
    }
  };

  const handleDownload = () => {
    if (!state.currentImage) return;
    const link = document.createElement('a');
    link.href = state.currentImage;
    link.download = `visionary-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyCanvasFilter = (filterType: 'sepia' | 'grayscale' | 'none') => {
    if (!state.currentImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (filterType === 'sepia') {
        ctx.filter = 'sepia(1)';
      } else if (filterType === 'grayscale') {
        ctx.filter = 'grayscale(1)';
      } else {
        ctx.filter = 'none';
      }
      
      ctx.drawImage(img, 0, 0);
      const filteredUrl = canvas.toDataURL('image/png');
      setState(prev => ({ ...prev, currentImage: filteredUrl }));
    };
    img.src = state.currentImage;
  };

  const resizeImage = (width: number, height: number) => {
    if (!state.currentImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const resizedUrl = canvas.toDataURL('image/png');
      setState(prev => ({ ...prev, currentImage: resizedUrl }));
    };
    img.src = state.currentImage;
  };

  const cropImage = () => {
    // Basic crop simulation: crop center 80%
    if (!state.currentImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height) * 0.8;
      const x = (img.width - side) / 2;
      const y = (img.height - side) / 2;
      canvas.width = side;
      canvas.height = side;
      ctx.drawImage(img, x, y, side, side, 0, 0, side, side);
      const croppedUrl = canvas.toDataURL('image/png');
      setState(prev => ({ ...prev, currentImage: croppedUrl }));
    };
    img.src = state.currentImage;
  };

  const clearCanvas = () => {
    setState(prev => ({ ...prev, currentImage: null, prompt: '', error: null, isEditing: false }));
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Visionary <span className="gradient-text">Studio</span></h1>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Gemini 2.5 Flash</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-3 space-y-6">
          <section className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['1:1', '16:9', '9:16', '4:3'] as AspectRatio[]).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setState(prev => ({ ...prev, selectedRatio: ratio }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    state.selectedRatio === ratio 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </section>

          <section className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Art Style</h3>
            <div className="space-y-2">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setState(prev => ({ ...prev, selectedStyle: style.id }))}
                  className={`w-full px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                    state.selectedStyle === style.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Center Canvas Area */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass rounded-3xl p-4 min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden bg-slate-900/50">
            {state.currentImage ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative group max-w-full">
                  <img 
                    src={state.currentImage} 
                    alt="Current work" 
                    className={`max-w-full max-h-[500px] rounded-xl object-contain shadow-2xl transition-all ${state.isEditing ? 'ring-2 ring-indigo-500' : ''}`}
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={handleDownload}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                      title="Download Image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setState(prev => ({ ...prev, isEditing: !prev.isEditing }))}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                      title="Toggle Edit Tools"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={clearCanvas}
                      className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {state.isEditing && (
                  <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                    <button onClick={() => applyCanvasFilter('grayscale')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg text-slate-200">B&W</button>
                    <button onClick={() => applyCanvasFilter('sepia')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg text-slate-200">Sepia</button>
                    <button onClick={() => applyCanvasFilter('none')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg text-slate-200">Reset Filter</button>
                    <div className="w-px h-6 bg-slate-600 mx-1"></div>
                    <button onClick={() => resizeImage(512, 512)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg text-slate-200">Resize 512px</button>
                    <button onClick={cropImage} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg text-slate-200">Center Crop</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-6 text-slate-400">
                <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-700 text-slate-600">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-200">Create a Masterpiece</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Describe your vision or upload a photo to enhance it with AI power.</p>
                </div>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="mx-auto rounded-full px-8">
                   Upload Photo
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            )}

            {state.isGenerating && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-10 rounded-3xl">
                <div className="text-center">
                  <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl font-bold text-white tracking-tight">Visionary is generating...</p>
                  <p className="text-indigo-400 text-sm mt-2 font-medium">Mixing colors and shaping pixels</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-6 space-y-4 shadow-2xl border-t-white/10">
             <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prompt</label>
                {uploadFile && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase">Edit Mode Active</span>
                )}
             </div>
             <textarea 
               value={state.prompt}
               onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value, error: null }))}
               placeholder={uploadFile ? "How should AI edit this image? (e.g., 'Make it look like Mars')" : "A majestic mountain range at sunrise, detailed 8k..."}
               className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[120px]"
             />
             
             {state.error && (
               <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center gap-3">
                 <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 {state.error}
               </div>
             )}

             <div className="flex gap-3">
               <Button 
                 onClick={handleGenerate} 
                 isLoading={state.isGenerating}
                 className="flex-1 rounded-2xl py-4"
               >
                 {uploadFile ? "Enhance Image" : "Generate Masterpiece"}
               </Button>
             </div>
          </div>
        </div>

        {/* Right History Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              History
            </h2>
            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{state.history.length}</span>
          </div>

          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
            {state.history.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {state.history.map(img => (
                  <div key={img.id} className="relative">
                    <HistoryCard 
                      image={img} 
                      onSelect={(i) => setState(prev => ({ ...prev, currentImage: i.url, prompt: i.prompt, isEditing: false }))} 
                    />
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <span className="text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded uppercase font-bold backdrop-blur">{img.aspectRatio}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center glass rounded-2xl opacity-40">
                <p className="text-xs text-slate-500">No creations yet. Start prompting!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <footer className="py-6 px-6 text-center text-slate-600 text-[10px] border-t border-slate-900 bg-slate-950/50">
        <p>VISIONARY AI STUDIO &copy; {new Date().getFullYear()} &bull; POWERED BY GOOGLE GENAI</p>
      </footer>
    </div>
  );
};

export default App;
