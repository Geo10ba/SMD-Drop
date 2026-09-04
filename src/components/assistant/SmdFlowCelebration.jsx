import { useEffect } from "react";
import confetti from "canvas-confetti";

export function SmdFlowCelebration() {
  useEffect(() => {
    const handleSale = (e) => {
      const detail = e.detail;
      const value = detail?.value || "Nova venda!";
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#f59e0b", "#10b981", "#3b82f6"]
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#f59e0b", "#10b981", "#3b82f6"]
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    };

    window.addEventListener("smdflow-sale", handleSale);

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        window.dispatchEvent(new CustomEvent("smdflow-sale", { detail: { value: 150.00 } }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("smdflow-sale", handleSale);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
