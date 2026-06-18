import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MessageSquare, ArrowLeft } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Premium Solar System 404                                          */
/* ------------------------------------------------------------------ */

// A single 3D orbital ring with an orbiting planet
function OrbitRing({ size, color, duration, planetSize, planetColor, delay = 0 }) {
  return (
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        animate={{ rotateZ: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
        className="w-full h-full absolute inset-0 rounded-full"
      >
        <div 
          className="absolute rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          style={{
            width: planetSize,
            height: planetSize,
            backgroundColor: planetColor,
            top: -planetSize / 2,
            left: '50%',
            transform: `translateX(-50%) rotateX(-70deg)`, // Counter-rotate to face camera
            boxShadow: `0 0 20px ${planetColor}40, inset -2px -2px 6px rgba(0,0,0,0.5)`,
          }}
        />
      </motion.div>
    </div>
  );
}

export default function NotFound() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#010204] text-white overflow-hidden relative flex flex-col justify-between selection:bg-blue-500/30">
      
      {/* --- Cosmic Background --- */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px]" />
      </div>

      {/* --- The Visible Solar System --- */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none perspective-[1000px]">
        <motion.div 
          className="relative w-full h-full flex items-center justify-center transform-style-3d"
          animate={{
            rotateX: 70 + mousePos.y * 0.5,
            rotateY: mousePos.x,
          }}
          transition={{ type: "spring", stiffness: 40, damping: 30 }}
          style={{ transformOrigin: "center center" }}
        >
          {/* Central Star */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-blue-100 via-blue-400 to-blue-700 blur-[2px] shadow-[0_0_100px_rgba(59,130,246,0.6),0_0_200px_rgba(59,130,246,0.2)]" />
          
          {/* Inner Glow Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full bg-blue-500/10 blur-[40px]" />

          {/* Orbital Rings & Planets */}
          <OrbitRing size={300} duration={15} planetSize={8} planetColor="#ffffff" delay={0} />
          <OrbitRing size={450} duration={25} planetSize={14} planetColor="#93c5fd" delay={2} />
          <OrbitRing size={650} duration={40} planetSize={24} planetColor="#3b82f6" delay={5} />
          <OrbitRing size={900} duration={60} planetSize={18} planetColor="#8b5cf6" delay={1} />
          <OrbitRing size={1200} duration={90} planetSize={32} planetColor="#1e3a8a" delay={8} />
          
          {/* Outer Faint Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] rounded-full border border-white/[0.02]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] rounded-full border border-white/[0.01] border-dashed" />
        </motion.div>
      </div>

      {/* --- Top Navigation Bar --- */}
      <header className="relative z-10 p-6 md:p-10 flex justify-between items-center w-full max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Orbit Logo" className="w-8 h-8 opacity-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" onError={(e) => e.target.src = '/logo.svg'} />
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/90" style={{ fontFamily: 'Spectron, sans-serif' }}>
            Orbit
          </span>
        </div>
      </header>

      {/* --- Center Content --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pointer-events-none mt-[-10vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative"
        >
          <h1 
            style={{ fontFamily: 'Spectron, sans-serif' }}
            className="text-[120px] md:text-[200px] lg:text-[280px] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/0 drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent blur-[2px] mix-blend-screen" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          className="max-w-xl mt-8"
        >
          <h2 className="text-2xl md:text-3xl font-light text-white/90 tracking-wide mb-4">
            You've drifted off course.
          </h2>
          <p className="text-sm md:text-base text-white/50 leading-relaxed font-light">
            The sector you are looking for does not exist within the known Orbit system. Return to base or establish a new connection.
          </p>
        </motion.div>
      </main>

      {/* --- Bottom Navigation --- */}
      <footer className="relative z-10 p-6 md:p-12 pb-12 w-full max-w-[1200px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex justify-center"
        >
          <button
            onClick={() => navigate('/')}
            className="group flex flex-col items-center p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 backdrop-blur-md w-full max-w-[320px]"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Home className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-base font-semibold text-white/90 mb-1">Return Home</span>
            <span className="text-sm text-white/40">Navigate back to safety</span>
          </button>
        </motion.div>
      </footer>

    </div>
  );
}
