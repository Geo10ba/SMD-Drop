import React, { useEffect, useRef, useState } from "react";

const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4"];

function ConfettiPiece({ delay, x, color }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: -10,
        width: 6,
        height: 6,
        background: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animation: `confettiFall 1.5s ease-in ${delay}s infinite`,
        transformOrigin: "center",
      }}
    />
  );
}

export function LumenMascot({ emotion = "normal", skin = "default", onClick, className = "", isMecha = false, isDizzy = false }) {
  const containerRef = useRef(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [confetti] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.15,
      x: 5 + (i % 4) * 20,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }))
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 5;
      if (distance > 0) {
        const moveX = (deltaX / distance) * Math.min(distance / 20, maxDistance);
        const moveY = (deltaY / distance) * Math.min(distance / 20, maxDistance);
        setEyeOffset({ x: moveX, y: moveY });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (emotion !== "happy" && emotion !== "celebrating" && emotion !== "sleeping") {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, 4000 + Math.random() * 4000);
    return () => clearInterval(blinkInterval);
  }, [emotion]);

  const isCelebrating = emotion === "celebrating";
  const isExcited = emotion === "excited";
  const isWorried = emotion === "worried";

  const rightArmTransform = isCelebrating
    ? "rotate(-150deg)"
    : isExcited
    ? "rotate(-130deg)"
    : isHovered
    ? undefined
    : "rotate(-12deg)";

  const leftArmTransform = isCelebrating
    ? "rotate(150deg)"
    : isExcited
    ? "rotate(130deg)"
    : "rotate(12deg)";

  return (
    <>
      <style>{`
        @keyframes lumenWave {
          0%, 100% { transform: rotate(-100deg); }
          50% { transform: rotate(-140deg); }
        }
        .animate-lumen-wave { animation: lumenWave 0.8s ease-in-out infinite; }

        @keyframes lumenLevitate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-lumen-levitate { animation: lumenLevitate 3s ease-in-out infinite; }

        @keyframes lumenCelebrateJump {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-14px) scale(1.05); }
          75% { transform: translateY(-7px) scale(1.02); }
        }
        .animate-lumen-celebrate { animation: lumenCelebrateJump 0.7s ease-in-out infinite; }

        @keyframes lumenExcitedShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-4deg); }
          40% { transform: rotate(4deg); }
          60% { transform: rotate(-3deg); }
          80% { transform: rotate(3deg); }
        }
        .animate-lumen-excited { animation: lumenExcitedShake 0.4s ease-in-out infinite; }

        @keyframes lumenWorriedShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-lumen-worried { animation: lumenWorriedShake 0.3s ease-in-out infinite; }

        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }

        @keyframes lumenGlowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-lumen-glow-pulse { animation: lumenGlowPulse 1s ease-in-out infinite; }

        @keyframes lumenFocusPulse {
          0%, 100% { filter: drop-shadow(0 0 4px #ef4444); }
          50% { filter: drop-shadow(0 0 12px #ef4444); }
        }
        .animate-lumen-focus-pulse { animation: lumenFocusPulse 1.5s ease-in-out infinite; }
      `}</style>

      {isCelebrating && (
        <div className="absolute -inset-10 overflow-hidden pointer-events-none z-10">
          {confetti.map((c) => (
            <ConfettiPiece key={c.id} {...c} />
          ))}
        </div>
      )}

      {/* Mecha Crown */}
      {isMecha && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg z-10 animate-pulse">
          👑
        </div>
      )}

      <div
        ref={containerRef}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative flex items-center justify-center transition-transform ${
          isDizzy ? "animate-spin" : "animate-lumen-levitate"
        } ${className}`}
        style={{ width: 85, height: 115 }}
      >
        <svg
          viewBox="0 0 150 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full drop-shadow-2xl ${
            isCelebrating ? "animate-lumen-celebrate" : isExcited ? "animate-lumen-excited" : isWorried ? "animate-lumen-worried" : ""
          }`}
          overflow="visible"
        >
          <defs>
            <linearGradient id="gradient-lumen-bg" x1="0" y1="0" x2="150" y2="200">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="gradient-lumen-border" x1="0" y1="0" x2="150" y2="200">
              <stop offset="0%" stopColor={isCelebrating ? "#f59e0b" : isWorried ? "#f97316" : "#8b5cf6"} />
              <stop offset="100%" stopColor={isCelebrating ? "#10b981" : isWorried ? "#ef4444" : "#06b6d4"} />
            </linearGradient>
            <filter id="lumen-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {skin === "pro" && (
            <path d="M 35 30 L 115 30 L 130 110 L 20 110 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          )}

          <g>
            {/* Pés */}
            <rect x="55" y="130" width="14" height="35" rx="7" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="3" />
            <rect x="48" y="155" width="28" height="15" rx="7.5" fill="#1e1b4b" stroke="url(#gradient-lumen-border)" strokeWidth="2" />

            <rect x="81" y="130" width="14" height="35" rx="7" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="3" />
            <rect x="74" y="155" width="28" height="15" rx="7.5" fill="#1e1b4b" stroke="url(#gradient-lumen-border)" strokeWidth="2" />

            {/* Braço Esquerdo */}
            <g style={{ transformOrigin: "30px 95px", transform: leftArmTransform, transition: "transform 0.4s ease" }}>
              <rect x="22" y="85" width="16" height="45" rx="8" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="3" />
            </g>

            {/* Tronco */}
            <rect x="40" y="75" width="70" height="65" rx="20" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="3" />

            {/* Reator de Peito */}
            <circle cx="75" cy="105" r="10" fill="#09090b" stroke="url(#gradient-lumen-border)" strokeWidth="2" />
            {emotion === "thinking" ? (
              <path d="M 72 105 L 75 108 L 79 102" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-pulse" filter="url(#lumen-glow)" />
            ) : isCelebrating ? (
              <path d="M 72 105 L 75 108 L 79 102" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-lumen-glow-pulse" filter="url(#lumen-glow)" />
            ) : isWorried ? (
              <path d="M 72 108 L 75 105 L 79 108" stroke="#f97316" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-pulse" filter="url(#lumen-glow)" />
            ) : (
              <path d="M 72 105 L 75 108 L 79 102" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}

            {isWorried && (
              <>
                <ellipse cx="105" cy="45" rx="4" ry="6" fill="#38bdf8" opacity="0.8" className="animate-bounce" style={{ animationDuration: "1s" }} />
                <ellipse cx="110" cy="55" rx="3" ry="4.5" fill="#38bdf8" opacity="0.6" className="animate-bounce" style={{ animationDuration: "1.3s" }} />
              </>
            )}

            {/* Braço Direito */}
            <g
              style={{
                transformOrigin: "120px 95px",
                transform: rightArmTransform,
                transition: "transform 0.4s ease",
              }}
              className={!rightArmTransform && isHovered ? "animate-lumen-wave" : ""}
            >
              <rect x="112" y="85" width="16" height="45" rx="8" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="3" />
              {isCelebrating && (
                <circle cx="120" cy="83" r="8" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="2" />
              )}
            </g>

            {/* Cabeça */}
            <g
              style={{
                transform: `translate(${eyeOffset.x * 0.4}px, ${eyeOffset.y * 0.4 + (emotion === "sleeping" ? 8 : 0)}px)`,
              }}
              className="transition-transform duration-500 ease-out"
            >
              {/* Zzz (sleeping) */}
              {emotion === "sleeping" && (
                <g className="animate-bounce" style={{ animationDuration: "3s" }}>
                  <text x="95" y="22" fill="#a855f7" fontSize="16" fontWeight="bold" filter="url(#lumen-glow)">Z</text>
                  <text x="110" y="12" fill="#a855f7" fontSize="12" fontWeight="bold" filter="url(#lumen-glow)">z</text>
                  <text x="120" y="2" fill="#a855f7" fontSize="10" fontWeight="bold" filter="url(#lumen-glow)">z</text>
                </g>
              )}

              {/* Estrelas comemorando */}
              {isCelebrating && (
                <>
                  <text x="28" y="20" fontSize="14" filter="url(#lumen-glow)" className="animate-bounce" style={{ animationDuration: "0.6s" }}>⭐</text>
                  <text x="100" y="18" fontSize="12" filter="url(#lumen-glow)" className="animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "0.7s" }}>✨</text>
                </>
              )}

              {/* Antena */}
              <g style={{ transformOrigin: "75px 30px" }} className={emotion === "thinking" ? "animate-spin" : ""}>
                <line x1="75" y1="10" x2="75" y2="25" stroke="url(#gradient-lumen-border)" strokeWidth="3" />
                <circle
                  cx="75"
                  cy="6"
                  r="5"
                  fill={isCelebrating ? "#f59e0b" : isWorried ? "#f97316" : emotion === "thinking" ? "#3b82f6" : "#8b5cf6"}
                  className={emotion === "thinking" || isCelebrating ? "animate-pulse" : ""}
                  filter="url(#lumen-glow)"
                />
              </g>

              {/* Capacete / Rosto */}
              <rect x="35" y="25" width="80" height="55" rx="20" fill="url(#gradient-lumen-bg)" stroke="url(#gradient-lumen-border)" strokeWidth="3" />

              {/* Visor Neon */}
              <rect x="45" y="35" width="60" height="30" rx="10" fill="#09090b" stroke="#3b0764" strokeWidth="2" />
              <path d="M 48 42 Q 75 35 102 42" stroke="white" strokeWidth="2" strokeLinecap="round" className="opacity-10" />

              {/* Olhos LED */}
              <g
                style={{ transform: `translate(${eyeOffset.x * 1.5}px, ${eyeOffset.y * 1.5}px)` }}
                className="transition-transform duration-75"
              >
                {emotion === "focus" && (
                  <>
                    <circle cx="60" cy="50" r="7" fill="#ef4444" className="animate-lumen-focus-pulse" />
                    <circle cx="90" cy="50" r="7" fill="#ef4444" className="animate-lumen-focus-pulse" />
                    <circle cx="60" cy="50" r="3" fill="#fca5a5" />
                    <circle cx="90" cy="50" r="3" fill="#fca5a5" />
                    <path d="M 60 50 L 60 150" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.2" className="animate-pulse" />
                    <path d="M 90 50 L 90 150" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.2" className="animate-pulse" />
                  </>
                )}
                {(emotion === "normal" || emotion === "thinking") && (
                  <>
                    <ellipse cx="60" cy="50" rx="6" ry={isBlinking ? 1 : 7} fill="#a855f7" filter="url(#lumen-glow)" />
                    <ellipse cx="90" cy="50" rx="6" ry={isBlinking ? 1 : 7} fill="#a855f7" filter="url(#lumen-glow)" />
                    {!isBlinking && (
                      <>
                        <circle cx="62" cy="47" r="2" fill="white" />
                        <circle cx="92" cy="47" r="2" fill="white" />
                      </>
                    )}
                  </>
                )}
                {emotion === "happy" && (
                  <>
                    <path d="M 53 53 Q 60 42 67 53" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#lumen-glow)" />
                    <path d="M 83 53 Q 90 42 97 53" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#lumen-glow)" />
                  </>
                )}
                {emotion === "celebrating" && (
                  <>
                    <text x="50" y="56" fontSize="18" textAnchor="middle" filter="url(#lumen-glow)">★</text>
                    <text x="80" y="56" fontSize="18" textAnchor="middle" filter="url(#lumen-glow)" fill="#f59e0b">★</text>
                  </>
                )}
                {emotion === "excited" && (
                  <>
                    <ellipse cx="60" cy="50" rx="8" ry="9" fill="#a855f7" filter="url(#lumen-glow)" />
                    <ellipse cx="90" cy="50" rx="8" ry="9" fill="#a855f7" filter="url(#lumen-glow)" />
                    <circle cx="63" cy="47" r="3" fill="white" />
                    <circle cx="93" cy="47" r="3" fill="white" />
                  </>
                )}
                {emotion === "worried" && (
                  <>
                    <ellipse cx="60" cy="52" rx="6" ry="5" fill="#f97316" filter="url(#lumen-glow)" />
                    <ellipse cx="90" cy="52" rx="6" ry="5" fill="#f97316" filter="url(#lumen-glow)" />
                    <path d="M 54 43 L 66 47" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" filter="url(#lumen-glow)" />
                    <path d="M 84 47 L 96 43" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" filter="url(#lumen-glow)" />
                  </>
                )}
                {emotion === "error" && (
                  <>
                    <path d="M 55 45 L 65 55 M 65 45 L 55 55" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" filter="url(#lumen-glow)" />
                    <path d="M 85 45 L 95 55 M 95 45 L 85 55" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" filter="url(#lumen-glow)" />
                  </>
                )}
                {emotion === "sleeping" && (
                  <>
                    <path d="M 54 50 Q 60 52 66 50" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none" className="opacity-60" />
                    <path d="M 84 50 Q 90 52 96 50" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none" className="opacity-60" />
                  </>
                )}
              </g>

              {/* Sorriso */}
              {isCelebrating && (
                <path d="M 60 70 Q 75 80 90 70" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#lumen-glow)" />
              )}
              {isWorried && (
                <path d="M 60 72 Q 75 68 90 72" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#lumen-glow)" />
              )}
            </g>
          </g>
        </svg>
      </div>
    </>
  );
}

// Export para compatibilidade
export { LumenMascot as SmdFlowMascot };
