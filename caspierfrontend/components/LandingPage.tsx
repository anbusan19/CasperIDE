import React, { useEffect, useState, useRef } from 'react';
import InteractiveMatrixSphere from './InteractiveMatrixSphere';
import { NeoButton } from './NeoButton';
import {
   Ghost, ArrowRight, Box, RefreshCcw, Wallet, Activity,
   Zap, CheckCircle, Terminal, Cpu, Globe, Shield, Code2,
   Copy, Check, Play, Database, Server, Bot, FolderTree, Rocket,
   Github, Twitter, ExternalLink, FileText, BookOpen, Calendar, MapPin,
   Sun, Moon
} from 'lucide-react';

interface LandingPageProps {
   onLaunch: () => void;
   theme: 'light' | 'dark';
   toggleTheme: () => void;
}

// --- 1. Utility Components ---
// const InteractiveMatrixSphere = () => {
//   const canvasRef = useRef(null);
//   const containerRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     let animationFrameId;

//     // State for mouse interaction
//     let mouseX = 0;
//     let mouseY = 0;
//     let targetRotationX = 0;
//     let targetRotationY = 0;

//     const handleMouseMove = (e) => {
//       const rect = canvas.getBoundingClientRect();
//       // Normalize mouse from -1 to 1
//       mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
//       mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
//     };

//     // Configuration
//     const rows = 12; // More density
//     const cols = 24;
//     const radius = 100; // Larger
//     const pixelSize = 2; 

//     // Generate Points
//     const points = [];
//     for (let lat = 0; lat < rows; lat++) {
//       const theta = (lat / (rows - 1)) * Math.PI - Math.PI / 2;
//       for (let lon = 0; lon < cols; lon++) {
//         const phi = (lon / cols) * 2 * Math.PI;
//         points.push({
//           x: radius * Math.cos(theta) * Math.cos(phi),
//           y: radius * Math.sin(theta),
//           z: radius * Math.cos(theta) * Math.sin(phi),
//           baseX: radius * Math.cos(theta) * Math.cos(phi),
//           baseY: radius * Math.sin(theta),
//           baseZ: radius * Math.cos(theta) * Math.sin(phi),
//           blinkOffset: Math.random() * Math.PI * 2,
//         });
//       }
//     }

//     let time = 0;
//     let currentRotationX = 0;
//     let currentRotationY = 0;

//     const render = () => {
//       const rect = containerRef.current.getBoundingClientRect();
//       canvas.width = rect.width;
//       canvas.height = rect.height;
//       const centerX = canvas.width / 2;
//       const centerY = canvas.height / 2;

//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Smooth rotation dampening
//       targetRotationY = time * 0.5 + (mouseX * 0.5); // Auto rotate + mouse influence
//       targetRotationX = (mouseY * 0.5);

//       currentRotationY += (targetRotationY - currentRotationY) * 0.1;
//       currentRotationX += (targetRotationX - currentRotationX) * 0.1;

//       time += 0.01;

//       points.forEach(point => {
//         // 1. Rotate Y
//         let x1 = point.baseX * Math.cos(currentRotationY) - point.baseZ * Math.sin(currentRotationY);
//         let z1 = point.baseZ * Math.cos(currentRotationY) + point.baseX * Math.sin(currentRotationY);
//         let y1 = point.baseY;

//         // 2. Rotate X
//         let y2 = y1 * Math.cos(currentRotationX) - z1 * Math.sin(currentRotationX);
//         let z2 = y1 * Math.sin(currentRotationX) + z1 * Math.cos(currentRotationX);
//         let x2 = x1;

//         // Perspective
//         const perspective = 300;
//         const scale = perspective / (perspective + z2);
//         const screenX = centerX + x2 * scale;
//         const screenY = centerY + y2 * scale;

//         // Visibility / Alpha
//         const isBack = z2 < -20; // Hide back dots more aggressively
//         if (isBack) return; 

//         const blink = Math.sin(time * 3 + point.blinkOffset);
//         const alpha = Math.max(0.1, (blink + 1) / 2); // Normalize 0 to 1

//         // Dynamic Color: Red to White gradient based on depth
//         const red = 255;
//         const green = Math.floor(45 + (blink * 50)); 
//         const blue = Math.floor(46 + (blink * 50));

//         ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

//         // Draw "Digital" rects
//         const size = pixelSize * scale * (blink > 0.8 ? 2 : 1); // Pulse size
//         ctx.fillRect(screenX, screenY, size, size);

//         // Optional: Draw connecting lines for "Network" feel if close
//         // (Skipped for performance to keep it clean)
//       });

//       animationFrameId = requestAnimationFrame(render);
//     };

//     render();
//     window.addEventListener('mousemove', handleMouseMove);

//     return () => {
//       cancelAnimationFrame(animationFrameId);
//       window.removeEventListener('mousemove', handleMouseMove);
//     };
// //   }, []);

//   return (
//     <div ref={containerRef} className="w-full h-full relative group cursor-crosshair">
//        {/* Decorative HUD Elements around canvas */}
//       <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#ff2d2e] opacity-50"></div>
//       <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#ff2d2e] opacity-50"></div>
//       <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#ff2d2e] opacity-50"></div>
//       <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#ff2d2e] opacity-50"></div>

//       <canvas ref={canvasRef} className="block w-full h-full" />

//     </div>
//   );
// };
const MinimalAscii = ({ theme }: { theme: 'light' | 'dark' }) => {
   const isDark = theme === 'dark';
   return (
      <div className={`w-full h-full border-2 border-[#ff2d2e] flex items-center justify-center relative group select-none overflow-hidden aspect-video sm:aspect-auto transition-colors ${
         isDark ? 'bg-[#1a1a1a]' : 'bg-[#f3f4f6]'
      }`}>
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff2d2e]/5 to-transparent z-20 animate-scanline pointer-events-none" />
         <pre className="relative z-10 font-mono text-[8px] sm:text-[10px] leading-[10px] text-[#ff2d2e] font-bold whitespace-pre text-center">
            {`
      .::.
    .::::::.
  .::'  '::.
 .::      ::.
 ::        ::
 ::        ::   CASPIER
 ::        ::    IDE
 '::      ::'
  '::.  .::'
    '::::::'
      '::'
 [ SYSTEM_READY ]
`}
         </pre>
      </div>
   );
};

// --- 2. Progressive Scroll Simulation Component ---

const SimulationScroll = ({ theme }: { theme: 'light' | 'dark' }) => {
   const [activeStep, setActiveStep] = useState(0);
   const containerRef = useRef<HTMLDivElement>(null);
   const isDark = theme === 'dark';

   // Scroll detection logic
   useEffect(() => {
      const handleScroll = () => {
         if (!containerRef.current) return;
         const steps = containerRef.current.querySelectorAll('.sim-step');

         steps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            // If the step is in the middle of the screen
            if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
               setActiveStep(index);
            }
         });
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   const steps = [
      {
         id: 0,
         title: "Write Code",
         desc: "Use the Monaco editor with syntax highlighting for Rust and AssemblyScript. Multiple file tabs and workspace management.",
         icon: <Code2 size={24} />
      },
      {
         id: 1,
         title: "Compile to WASM",
         desc: "Compile your smart contracts directly in the browser via GCP service. Get instant feedback and optimization options.",
         icon: <Cpu size={24} />
      },
      {
         id: 2,
         title: "Test & Debug",
         desc: "View compilation results, inspect WASM bytecode, and check contract metadata in the terminal panel.",
         icon: <Terminal size={24} />
      },
      {
         id: 3,
         title: "Deploy to Casper",
         desc: "Connect your wallet (Casper Wallet, Ledger, or Casper Signer) and deploy to testnet or mainnet with runtime arguments.",
         icon: <Rocket size={24} />
      }
   ];

   return (
      <div ref={containerRef} className={`relative border-y-2 border-[#ff2d2e] transition-colors duration-300 ${
         isDark ? 'bg-[#1a1a1a]' : 'bg-[#f3f4f6]'
      }`}>
         <div className="max-w-8xl mx-auto px-6 grid lg:grid-cols-2 gap-12">

            {/* Left: Scrollable Triggers */}
            <div className="relative z-10 py-24">
               {steps.map((step, index) => (
                  <div key={step.id} className={`sim-step min-h-[80vh] flex flex-col justify-center border-l-2 pl-8 transition-opacity duration-500 ${
                     isDark ? 'border-[#333]' : 'border-gray-300'
                  }`}
                     style={{ opacity: activeStep === index ? 1 : 0.3 }}>
                     <div className={`mb-4 w-12 h-12 flex items-center justify-center rounded-full border-2 
                  ${activeStep === index ? 'bg-[#ff2d2e] text-white border-[#ff2d2e]' : `bg-transparent border-gray-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}`}>
                        {step.icon}
                     </div>
                     <h3 className={`text-4xl font-display font-black uppercase mb-4 transition-colors ${
                        isDark ? 'text-white' : 'text-[#1a1a1a]'
                     }`}>{step.title}</h3>
                     <p className={`text-xl font-mono leading-relaxed max-w-md transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                     }`}>{step.desc}</p>
                  </div>
               ))}
            </div>

            {/* Right: Sticky Visual Stage */}
            <div className="hidden lg:block relative">
               <div className="sticky top-24 h-[640px] flex items-center">
                  {/* IDE Frame - Theme Aware */}
                  <div className={`w-full border overflow-hidden relative transition-all duration-500 ${
                     isDark 
                        ? 'bg-[#000000] border-[#333333]' 
                        : 'bg-white border-gray-300'
                  }`}>

                     {/* IDE Header */}
                     <div className={`h-12 border-b flex items-center px-4 justify-between shrink-0 transition-colors ${
                        isDark 
                           ? 'bg-[#000000] border-[#333333]' 
                           : 'bg-gray-100 border-gray-300'
                     }`}>
                        <div className="flex items-center gap-3">
                           <span className={`font-bold tracking-wider text-sm transition-colors ${
                              isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
                           }`}>CASPIER <span className="text-[#ff2d2e] text-xs ml-0.5">v1.2</span></span>
                           <div className={`h-4 w-[1px] transition-colors ${
                              isDark ? 'bg-[#333333]' : 'bg-gray-300'
                           }`}></div>
                           <div className={`text-xs font-bold uppercase transition-colors ${
                              isDark ? 'text-[#808080]' : 'text-gray-600'
                           }`}>default_workspace</div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff2d2e] to-blue-500 opacity-80"></div>
                        </div>
                     </div>

                     {/* Main IDE Area */}
                     <div className={`h-[500px] relative flex overflow-hidden transition-colors ${
                        isDark ? 'bg-[#0a0a0a]' : 'bg-white'
                     }`}>

                        {/* Activity Bar (Left Sidebar) */}
                        <div className={`w-12 border-r flex flex-col items-center py-4 gap-6 z-20 flex-shrink-0 transition-colors ${
                           isDark 
                              ? 'bg-[#000000] border-[#333333]' 
                              : 'bg-gray-50 border-gray-300'
                        }`}>
                           <Box className={`w-6 h-6 ${activeStep >= 0 ? 'text-[#ff2d2e]' : isDark ? 'text-[#808080]' : 'text-gray-400'}`} />
                           <Wallet className={`w-6 h-6 ${activeStep >= 3 ? 'text-[#ff2d2e]' : isDark ? 'text-[#808080]' : 'text-gray-400'}`} />
                           <div className={`w-6 h-6 flex items-center justify-center ${activeStep >= 1 ? 'text-[#ff2d2e]' : isDark ? 'text-[#808080]' : 'text-gray-400'}`}>
                              <Cpu size={24} />
                           </div>
                           <div className={`w-6 h-6 flex items-center justify-center ${activeStep >= 2 ? 'text-[#ff2d2e]' : isDark ? 'text-[#808080]' : 'text-gray-400'}`}>
                              <Terminal size={24} />
                           </div>
                        </div>

                        {/* Editor Area */}
                        <div className={`flex-1 flex flex-col min-w-0 relative transition-colors ${
                           isDark ? 'bg-[#0a0a0a]' : 'bg-white'
                        }`}>

                           {/* Editor Tabs */}
                           <div className={`h-8 border-b flex items-center px-2 gap-1 flex-shrink-0 transition-colors ${
                              isDark 
                                 ? 'bg-[#111111] border-[#333333]' 
                                 : 'bg-gray-100 border-gray-300'
                           }`}>
                              <div className={`px-3 py-1 border-b-2 border-[#ff2d2e] text-xs font-mono transition-colors ${
                                 isDark 
                                    ? 'bg-[#000000] text-[#e0e0e0]' 
                                    : 'bg-white text-gray-900'
                              }`}>
                                 main.rs
                              </div>
                           </div>

                           {/* Editor Toolbar */}
                           <div className={`h-9 border-b flex items-center px-4 justify-between flex-shrink-0 transition-colors ${
                              isDark 
                                 ? 'bg-[#000000] border-[#333333]' 
                                 : 'bg-gray-50 border-gray-300'
                           }`}>
                              <span className={`text-xs font-mono transition-colors ${
                                 isDark ? 'text-[#808080]' : 'text-gray-600'
                              }`}>main.rs</span>
                              <div className="flex items-center gap-2">
                                 <div className={`text-[#ff2d2e] border border-[#ff2d2e] px-2 py-1 text-xs font-bold transition-colors ${
                                    isDark ? 'bg-[#000000]' : 'bg-white'
                                 }`}>
                                    Compile
                                 </div>
                                 <div className={`text-[#ff2d2e] border border-[#ff2d2e] px-2 py-1 text-xs font-bold transition-colors ${
                                    isDark ? 'bg-[#000000]' : 'bg-white'
                                 }`}>
                                    Deploy
                                 </div>
                              </div>
                           </div>

                           {/* Code Editor Content */}
                           <div className={`flex-1 relative overflow-hidden transition-colors ${
                              isDark ? 'bg-[#0a0a0a]' : 'bg-white'
                           }`}>

                              {/* Editor Background with Line Numbers */}
                              <div className="absolute inset-0 flex">
                                 <div className={`w-12 border-r flex flex-col text-xs font-mono pt-2 transition-colors ${
                                    isDark 
                                       ? 'bg-[#111111] border-[#333333] text-[#444444]' 
                                       : 'bg-gray-50 border-gray-300 text-gray-400'
                                 }`}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                       <div key={i} className="px-2 text-right">{i}</div>
                                    ))}
                                 </div>
                                 <div className={`flex-1 p-4 font-mono text-xs leading-relaxed transition-colors ${
                                    isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
                                 }`}>
                                    {activeStep === 0 && (
                                       <div className="space-y-1">
                                          <div><span className="text-[#ff2d2e] font-bold">#[no_mangle]</span></div>
                                          <div><span className="text-purple-400">pub extern</span> "C" <span className="text-[#ff2d2e] font-bold">fn</span> <span className="text-blue-400">call</span>() {'{'}</div>
                                          <div className={`pl-4 ${isDark ? 'text-[#608b4e]' : 'text-green-600'}`}>// Caspier IDE</div>
                                          <div className="pl-4"><span className="text-[#ff2d2e] font-bold">use</span> casper_contract...</div>
                                       </div>
                                    )}
                                    {activeStep >= 1 && (
                                       <div className="space-y-1">
                                          <div className="text-green-500">✓ Compilation successful!</div>
                                          <div className={isDark ? 'text-[#808080]' : 'text-gray-600'}>WASM size: 45.2 KB</div>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* Compiler Status Panel (Step 1+) */}
                              {activeStep >= 1 && (
                                 <div className={`absolute top-4 right-4 border p-3 w-56 animate-fade-in-up z-10 transition-colors ${
                                    isDark 
                                       ? 'bg-[#111111] border-[#333333]' 
                                       : 'bg-gray-100 border-gray-300'
                                 }`}>
                                    <div className="text-xs font-bold uppercase text-[#ff2d2e] mb-2">Compiler</div>
                                    <div className="space-y-2">
                                       <div className={`h-6 border flex items-center px-2 text-[10px] font-mono text-green-500 transition-colors ${
                                          isDark 
                                             ? 'bg-[#0a0a0a] border-[#333333]' 
                                             : 'bg-white border-gray-300'
                                       }`}>
                                          ✓ WASM Generated
                                       </div>
                                       <div className={`h-6 border flex items-center px-2 text-[10px] font-mono transition-colors ${
                                          isDark 
                                             ? 'bg-[#0a0a0a] border-[#333333] text-[#808080]' 
                                             : 'bg-white border-gray-300 text-gray-600'
                                       }`}>
                                          Size: 45.2 KB
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* Terminal Panel (Appears Step 2+) */}
                           <div className={`absolute bottom-0 left-0 right-0 border-t transition-all duration-500 ease-out z-30 transition-colors ${
                              activeStep >= 2 ? 'h-32' : 'h-0 overflow-hidden'
                           } ${
                              isDark 
                                 ? 'bg-[#000000] border-[#333333]' 
                                 : 'bg-gray-50 border-gray-300'
                           }`}>
                              <div className={`h-6 border-b flex items-center px-2 transition-colors ${
                                 isDark 
                                    ? 'bg-[#111111] border-[#333333]' 
                                    : 'bg-gray-100 border-gray-300'
                              }`}>
                                 <span className={`font-mono text-[10px] font-bold transition-colors ${
                                    isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
                                 }`}>TERMINAL</span>
                              </div>
                              <div className="p-2 font-mono text-[10px] text-green-500 space-y-1 overflow-hidden">
                                 {activeStep >= 2 && (
                                    <>
                                       <div className="animate-type-line-1">➜  ~ Compilation successful! WASM generated.</div>
                                       <div className={`animate-type-line-2 opacity-0 transition-colors ${isDark ? 'text-[#808080]' : 'text-gray-600'}`} style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>&gt; WASM size: 45.2 KB</div>
                                       <div className={`animate-type-line-3 opacity-0 transition-colors ${isDark ? 'text-[#808080]' : 'text-gray-600'}`} style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>&gt; Ready for deployment</div>
                                    </>
                                 )}
                              </div>
                           </div>

                           {/* Deploy Success Overlay (Step 3) */}
                           <div className={`absolute inset-0 z-40 flex items-center justify-center transition-all duration-500 ${
                              activeStep === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                           } ${isDark ? 'bg-[#000000]/95' : 'bg-white/95'}`}>
                              <div className="text-center">
                                 <div className="inline-block bg-[#ff2d2e] text-white p-4 mb-4">
                                    <Check size={32} strokeWidth={4} />
                                 </div>
                                 <h4 className={`text-xl font-display font-black uppercase transition-colors ${
                                    isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
                                 }`}>Deployed</h4>
                                 <div className={`font-mono text-xs mt-2 transition-colors ${
                                    isDark ? 'text-[#808080]' : 'text-gray-600'
                                 }`}>Hash: 0x8a7...f92b</div>
                              </div>
                           </div>

                        </div>

                     </div>

                     {/* Status Bar */}
                     <div className="h-6 bg-[#ff2d2e] text-white flex justify-between items-center px-3 text-xs font-bold flex-shrink-0">
                        <div className="flex gap-4">
                           <span>main*</span>
                           <span>0 problems</span>
                        </div>
                        <div className="flex gap-4">
                           <span>Ln 1, Col 1</span>
                           <span>UTF-8</span>
                           <span>RUST</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- 3. Main Landing Page ---

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, theme, toggleTheme }) => {
   const isDark = theme === 'dark';
   
   return (
      <div className={`min-h-screen font-sans selection:bg-[#ff2d2e] selection:text-white flex flex-col transition-colors duration-300 ${
         isDark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f3f4f6] text-[#1a1a1a]'
      }`}>

         <style>{`
          @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes type-line { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
          .animate-type-line-1 { animation: type-line 0.3s forwards; }
          .animate-type-line-2 { animation: type-line 0.3s forwards 0.5s; }
          .animate-fade-in-up { animation: type-line 0.5s ease-out forwards; }
       `}</style>

         {/* Header */}
         <header className={`h-20 border-b-2 border-[#ff2d2e] flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300 ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
         }`}>
            <div className="flex items-center gap-4">
               <img src="/Caspier-horizontal.svg" alt="Caspier" className="w-28" />
            </div>

            <div className="flex items-center gap-4">
               <a href="#" className={`font-bold font-display hover:text-[#ff2d2e] hidden md:block tracking-widest text-sm transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-900'
               }`}>DOCS</a>
               <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors ${
                     isDark 
                        ? 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-[#ff2d2e]'
                  }`}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
               >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <NeoButton variant="primary" onClick={onLaunch} theme={theme}>Launch App</NeoButton>
            </div>
         </header>

         <main className="flex-1 flex flex-col">
            {/* Hero Section */}
            <section className={`relative py-20 px-6 border-b-2 border-[#ff2d2e] overflow-hidden transition-colors duration-300 ${
               isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            }`}>
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ff2d2e 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}></div>
               <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                  <div className="space-y-8">
                     <h1 className={`text-6xl md:text-7xl font-display font-black uppercase leading-[0.9] tracking-tighter ${
                        isDark ? 'text-white' : 'text-[#1a1a1a]'
                     }`}>
                        Build on <span className="text-[#ff2d2e] underline decoration-4 underline-offset-4 decoration-current">Casper</span> in Your Browser
                     </h1>
                     <p className={`text-xl font-medium max-w-lg leading-relaxed font-mono transition-colors ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                     }`}>
                        Write, compile, deploy, and test Casper smart contracts. No local setup required.
                     </p>
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-mono transition-colors ${
                           isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>powered by</span>
                        <img src="/Casper_Wordmark_Horizontal_Red_RGB.png" alt="Casper" className="h-5" />
                     </div>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <a href="https://caspier-ide.vercel.app" target="_blank" rel="noopener noreferrer">
                           <NeoButton variant="primary" className="!text-lg !px-8 !py-4 shadow-neo-black hover:shadow-neo-black-hover" theme={theme}>
                              Start Building <ArrowRight className="ml-2" />
                           </NeoButton>
                        </a>
                     </div>
                  </div>
                  <div className="relative group">
                     <InteractiveMatrixSphere />
                  </div>
               </div>
            </section>

            {/* Trusted By Marquee */}
            <section className={`border-b-2 border-[#ff2d2e] py-6 overflow-hidden transition-colors duration-300 ${
               isDark ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'
            }`}>
               <div className="whitespace-nowrap flex gap-12 animate-[marquee_20s_linear_infinite] hover:pause">
                  {[...Array(2)].map((_, i) => (
                     <React.Fragment key={i}>
                        <span className={`font-display font-bold text-2xl uppercase mx-6 flex items-center gap-2 transition-colors ${
                           isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}><Globe size={20} /> Casper_Network</span>
                        <span className={`font-display font-bold text-2xl uppercase mx-6 flex items-center gap-2 transition-colors ${
                           isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}><Shield size={20} /> Enterprise_Grade</span>
                        <span className={`font-display font-bold text-2xl uppercase mx-6 flex items-center gap-2 transition-colors ${
                           isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}><Zap size={20} /> Proof_of_Stake</span>
                        <span className={`font-display font-bold text-2xl uppercase mx-6 flex items-center gap-2 transition-colors ${
                           isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}><Code2 size={20} /> Rust_AssemblyScript</span>
                     </React.Fragment>
                  ))}
               </div>
            </section>

            {/* SCROLL SIMULATION SECTION (New Implementation) */}
            <SimulationScroll theme={theme} />

            {/* Features Section */}
            <section className={`py-24 px-6 border-b-2 border-[#ff2d2e] transition-colors duration-300 ${
               isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            }`}>
               <div>
                  <div className="mb-16">
                     <h2 className={`text-5xl font-display font-black uppercase mb-4 transition-colors ${
                        isDark ? 'text-white' : 'text-[#1a1a1a]'
                     }`}>Powerful Features</h2>
                     <p className={`text-lg font-mono transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                     }`}>Everything you need to build on Casper Network</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                     <FeatureCard
                        icon={<Code2 size={32} />}
                        title="Monaco Editor"
                        desc="Professional code editor with syntax highlighting, multiple file tabs, and full Rust and AssemblyScript support."
                        theme={theme}
                     />
                     <FeatureCard
                        icon={<Cpu size={32} />}
                        title="WASM Compilation"
                        desc="Compile smart contracts via GCP service or browser. Real-time compilation feedback with optimization options."
                        theme={theme}
                     />
                     <FeatureCard
                        icon={<Bot size={32} />}
                        title="AI Assistant"
                        desc="Powered by Gemini AI. Get code help, review files using @mentions, and receive intelligent suggestions."
                        theme={theme}
                     />
                     <FeatureCard
                        icon={<Wallet size={32} />}
                        title="Wallet Integration"
                        desc="Connect Casper Wallet, Ledger, or Casper Signer. Deploy contracts with configurable gas and runtime arguments."
                        theme={theme}
                     />
                     <FeatureCard
                        icon={<FolderTree size={32} />}
                        title="Workspace Management"
                        desc="Create multiple workspaces, import/export projects as ZIP files, and manage your contracts efficiently."
                        theme={theme}
                     />
                     <FeatureCard
                        icon={<Rocket size={32} />}
                        title="Deploy & Execute"
                        desc="Deploy to testnet or mainnet, track deployed contracts, and run entrypoints with runtime arguments."
                        theme={theme}
                     />
                  </div>
               </div>
            </section>

            {/* Supported Languages Section */}
            <section className={`py-24 px-6 border-b-2 border-[#ff2d2e] transition-colors duration-300 ${
               isDark ? 'bg-[#1a1a1a]' : 'bg-[#f3f4f6]'
            }`}>
               <div className="grid lg:grid-cols-2 gap-12 items-stretch">
                  <div className="space-y-6">
                     <h2 className={`text-5xl font-display font-black uppercase leading-[0.9] transition-colors ${
                        isDark ? 'text-white' : 'text-[#1a1a1a]'
                     }`}>
                        Write in <span className="text-[#ff2d2e]">Rust</span> or <span className="text-[#ff2d2e]">AssemblyScript</span>
                     </h2>
                     <p className={`text-lg leading-relaxed font-mono transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                     }`}>
                        Choose your preferred language. Caspier supports both Rust and AssemblyScript smart contracts with full syntax highlighting and compilation support.
                     </p>
                     <div className="space-y-4">
                        <div className={`flex items-center gap-4 p-4 border-2 shadow-neo transition-colors ${
                           isDark 
                              ? 'bg-[#0a0a0a] border-gray-700' 
                              : 'bg-white border-[#1a1a1a]'
                        }`}>
                           <div className="w-12 h-12 flex items-center justify-center">
                              <img src="/rust.svg" alt="Rust" className="w-12 h-12" />
                           </div>
                           <div>
                              <h3 className={`font-display font-black uppercase transition-colors ${
                                 isDark ? 'text-white' : 'text-[#1a1a1a]'
                              }`}>Rust</h3>
                              <p className={`text-sm font-mono transition-colors ${
                                 isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>Native Casper SDK support</p>
                           </div>
                        </div>
                        <div className={`flex items-center gap-4 p-4 border-2 shadow-neo transition-colors ${
                           isDark 
                              ? 'bg-[#0a0a0a] border-gray-700' 
                              : 'bg-white border-[#1a1a1a]'
                        }`}>
                           <div className="w-12 h-12 flex items-center justify-center">
                              <img src="/assemblyscript.svg" alt="AssemblyScript" className="w-8 h-8" />
                           </div>
                           <div>
                              <h3 className={`font-display font-black uppercase transition-colors ${
                                 isDark ? 'text-white' : 'text-[#1a1a1a]'
                              }`}>AssemblyScript</h3>
                              <p className={`text-sm font-mono transition-colors ${
                                 isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>TypeScript-like syntax</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className={`relative border-2 shadow-neo-black p-1 flex flex-col h-full transition-colors ${
                     isDark 
                        ? 'border-gray-700 bg-[#0a0a0a]' 
                        : 'border-[#1a1a1a] bg-[#1a1a1a]'
                  }`}>
                     <div className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${
                        isDark 
                           ? 'border-gray-700 bg-[#111111]' 
                           : 'border-[#333] bg-[#222]'
                     }`}>
                        <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-[#ff2d2e]" /></div>
                        <div className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                           isDark ? 'text-gray-400' : 'text-gray-300'
                        }`}><Code2 size={14} /> contract.rs</div>
                     </div>
                     <div className={`p-4 font-mono text-xs md:text-sm overflow-x-auto leading-relaxed flex-1 transition-colors ${
                        isDark ? 'text-gray-300' : 'text-gray-300'
                     }`}>
                        <span className="text-[#ff2d2e]">#[no_mangle]</span><br />
                        <span className="text-purple-400">pub extern</span> "C" <span className="text-yellow-400">fn</span> <span className="text-blue-400">call</span>() {'{'}<br />
                        &nbsp;&nbsp;<span className="text-gray-500">// Caspier IDE</span><br />
                        &nbsp;&nbsp;<span className="text-yellow-400">use</span> casper_contract::contract_api::<span>{'{'}</span><br />
                        &nbsp;&nbsp;&nbsp;&nbsp;runtime, storage<br />
                        &nbsp;&nbsp;<span>{'}'}</span>;<br />
                        &nbsp;&nbsp;<span className="text-yellow-400">let</span> value: String = runtime::get_arg(<span className="text-green-400">"value"</span>)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;.unwrap_or_revert();<br />
                        {'}'}
                     </div>
                  </div>
               </div>
            </section>

            {/* Use Cases Section */}
            <section className={`py-24 px-6 border-b-2 border-[#ff2d2e] transition-colors duration-300 ${
               isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            }`}>
               <div>
                  <div className="mb-16">
                     <h2 className={`text-5xl font-display font-black uppercase mb-4 transition-colors ${
                        isDark ? 'text-white' : 'text-[#1a1a1a]'
                     }`}>Perfect For</h2>
                     <p className={`text-lg font-mono transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                     }`}>Whether you're learning or building production dApps</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                     <UseCaseCard
                        icon={<Zap size={24} />}
                        title="Learning Casper"
                        desc="Get started with Casper smart contracts without setting up a local development environment. Perfect for hackathons and tutorials."
                        theme={theme}
                     />
                     <UseCaseCard
                        icon={<Activity size={24} />}
                        title="Rapid Prototyping"
                        desc="Quickly test ideas and iterate on smart contract logic. Compile and test in seconds without leaving your browser."
                        theme={theme}
                     />
                     <UseCaseCard
                        icon={<Server size={24} />}
                        title="Production Development"
                        desc="Build and deploy real dApps. Full deployment pipeline with wallet integration and transaction monitoring."
                        theme={theme}
                     />
                     <UseCaseCard
                        icon={<Globe size={24} />}
                        title="Remote Collaboration"
                        desc="Share your workspace, collaborate on contracts, and deploy from anywhere. No environment setup required."
                        theme={theme}
                     />
                  </div>
               </div>
            </section>

            {/* Getting Started Section */}
            <section className={`py-24 px-6 border-b-2 border-[#ff2d2e] transition-colors duration-300 ${
               isDark ? 'bg-[#1a1a1a]' : 'bg-[#f3f4f6]'
            }`}>
               <div>
                  <div className="mb-16">
                     <h2 className={`text-5xl font-display font-black uppercase mb-4 transition-colors ${
                        isDark ? 'text-white' : 'text-[#1a1a1a]'
                     }`}>Get Started in Seconds</h2>
                     <p className={`text-lg font-mono transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                     }`}>No installation. No setup. Just start building.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                     <StepCard
                        number="1"
                        title="Launch IDE"
                        desc="Click 'Launch App' to open Caspier in your browser. No downloads required."
                        theme={theme}
                     />
                     <StepCard
                        number="2"
                        title="Write Code"
                        desc="Start with a template or write from scratch. Full Rust and AssemblyScript support."
                        theme={theme}
                     />
                     <StepCard
                        number="3"
                        title="Deploy"
                        desc="Compile, test, and deploy to Casper Network. Connect your wallet and go live."
                        theme={theme}
                     />
                  </div>

                  <div className="mt-12">
                     <NeoButton variant="primary" onClick={onLaunch} className="!text-lg !px-8 !py-4" theme={theme}>
                        Launch Caspier IDE <ArrowRight className="ml-2" />
                     </NeoButton>
                  </div>
               </div>
            </section>

            {/* Footer */}
            <footer className={`py-16 px-6 border-t-4 border-[#ff2d2e] transition-colors duration-300 ${
               isDark ? 'bg-[#1a1a1a] text-white' : 'bg-[#0a0a0a] text-white'
            }`}>
               <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                     {/* Brand Section */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                           <img src="/Caspier-horizontal.svg" alt="Caspier" className="w-28" />
                        </div>
                        <p className={`text-sm font-mono leading-relaxed transition-colors ${
                           isDark ? 'text-gray-400' : 'text-gray-400'
                        }`}>
                           Browser-Based IDE for building and deploying Casper smart contracts.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                           <span className={`text-xs font-mono transition-colors ${
                              isDark ? 'text-gray-500' : 'text-gray-500'
                           }`}>powered by</span>
                           <img src="/Casper_Wordmark_Horizontal_Red_RGB.png" alt="Casper" className="h-4" />
                        </div>
                     </div>

                     {/* Resources */}
                     <div>
                        <h3 className="font-display font-black text-lg uppercase mb-4 text-[#ff2d2e]">Resources</h3>
                        <ul className="space-y-3">
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <FileText size={14} />
                                 Documentation
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <BookOpen size={14} />
                                 Tutorials
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <Code2 size={14} />
                                 Templates
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <ExternalLink size={14} />
                                 Casper Network
                              </a>
                           </li>
                        </ul>
                     </div>

                     {/* Community */}
                     <div>
                        <h3 className="font-display font-black text-lg uppercase mb-4 text-[#ff2d2e]">Community</h3>
                        <ul className="space-y-3">
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <Github size={14} />
                                 GitHub
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <Twitter size={14} />
                                 Twitter
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <Globe size={14} />
                                 Discord
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm flex items-center gap-2 transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 <ExternalLink size={14} />
                                 Forum
                              </a>
                           </li>
                        </ul>
                     </div>

                     {/* Legal */}
                     <div>
                        <h3 className="font-display font-black text-lg uppercase mb-4 text-[#ff2d2e]">Legal</h3>
                        <ul className="space-y-3">
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 Privacy Policy
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 Terms of Service
                              </a>
                           </li>
                           <li>
                              <a href="#" className={`hover:text-[#ff2d2e] font-mono text-sm transition-colors ${
                                 isDark ? 'text-gray-300' : 'text-gray-300'
                              }`}>
                                 License
                              </a>
                           </li>
                        </ul>
                     </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${
                     isDark ? 'border-gray-800' : 'border-gray-700'
                  }`}>
                     <div className={`text-xs font-mono transition-colors ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                     }`}>
                        © 2024 Caspier. All rights reserved.
                     </div>
                     <div className="flex items-center gap-4">
                        <a href="#" className="text-gray-400 hover:text-[#ff2d2e] transition-colors" aria-label="GitHub">
                           <Github size={18} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-[#ff2d2e] transition-colors" aria-label="Twitter">
                           <Twitter size={18} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-[#ff2d2e] transition-colors" aria-label="Discord">
                           <Globe size={18} />
                        </a>
                     </div>
                  </div>
               </div>
            </footer>
         </main>
      </div>
   );
};

// --- Helper Components ---

const FeatureCard = ({ icon, title, desc, theme }: { icon: React.ReactNode, title: string, desc: string, theme: 'light' | 'dark' }) => {
   const isDark = theme === 'dark';
   return (
      <div className={`p-6 border-2 hover:shadow-neo transition-all ${
         isDark 
            ? 'bg-[#111111] border-gray-700' 
            : 'bg-white border-[#1a1a1a]'
      }`}>
         <div className="mb-4 text-[#ff2d2e]">{icon}</div>
         <h3 className={`font-display font-black text-xl uppercase mb-2 transition-colors ${
            isDark ? 'text-white' : 'text-[#1a1a1a]'
         }`}>{title}</h3>
         <p className={`text-sm font-mono leading-relaxed transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
         }`}>{desc}</p>
      </div>
   );
};

const UseCaseCard = ({ icon, title, desc, theme }: { icon: React.ReactNode, title: string, desc: string, theme: 'light' | 'dark' }) => {
   const isDark = theme === 'dark';
   return (
      <div className={`p-6 border-2 hover:shadow-neo transition-all ${
         isDark 
            ? 'bg-[#111111] border-gray-700' 
            : 'bg-white border-[#1a1a1a]'
      }`}>
         <div className="flex items-start gap-4">
            <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 text-[#ff2d2e] transition-colors ${
               isDark ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]'
            }`}>
               {icon}
            </div>
            <div>
               <h3 className={`font-display font-black text-xl uppercase mb-2 transition-colors ${
                  isDark ? 'text-white' : 'text-[#1a1a1a]'
               }`}>{title}</h3>
               <p className={`text-sm font-mono leading-relaxed transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
               }`}>{desc}</p>
            </div>
         </div>
      </div>
   );
};

const StepCard = ({ number, title, desc, theme }: { number: string, title: string, desc: string, theme: 'light' | 'dark' }) => {
   const isDark = theme === 'dark';
   return (
      <div className={`p-6 border-2 hover:shadow-neo transition-all text-center ${
         isDark 
            ? 'bg-[#111111] border-gray-700' 
            : 'bg-white border-[#1a1a1a]'
      }`}>
         <div className="w-16 h-16 bg-[#ff2d2e] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-display font-black text-2xl">
            {number}
         </div>
         <h3 className={`font-display font-black text-xl uppercase mb-2 transition-colors ${
            isDark ? 'text-white' : 'text-[#1a1a1a]'
         }`}>{title}</h3>
         <p className={`text-sm font-mono leading-relaxed transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
         }`}>{desc}</p>
      </div>
   );
};