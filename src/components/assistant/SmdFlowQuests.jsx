import React, { useState, useEffect } from "react";
import { CheckCircle2, Trophy, Gift, X, Zap, Calendar, ShoppingBag, Globe } from "lucide-react";

function getTodayKey() {
  return `smdflow_quests_${new Date().toISOString().slice(0, 10)}`;
}

function loadQuestState() {
  try {
    const raw = localStorage.getItem(getTodayKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveQuestState(state) {
  localStorage.setItem(getTodayKey(), JSON.stringify(state));
}

const BASE_QUESTS = [
  {
    id: "daily_checkin",
    label: "Check-in Diário SMD",
    description: "Acesse o painel hoje e marque presença",
    icon: Zap,
    points: 5,
  },
  {
    id: "view_calculator",
    label: "Usar Calculadora m²",
    description: "Simule um orçamento em acrílico sob medida",
    icon: Calendar,
    points: 5,
  },
  {
    id: "view_products",
    label: "Explorar Catálogo SMD",
    description: "Confira as últimas novidades de atacado",
    icon: ShoppingBag,
    points: 3,
  },
];

export function SmdFlowQuests({ onClose }) {
  const [questState, setQuestState] = useState(() => loadQuestState());
  const [rewardAnimating, setRewardAnimating] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const quests = BASE_QUESTS.map((q) => ({
    ...q,
    completed: !!questState[q.id],
  }));

  const completedCount = quests.filter((q) => q.completed).length;
  const allCompleted = completedCount === quests.length;

  useEffect(() => {
    const handleQuestDone = (e) => {
      const questId = e.detail?.questId;
      if (!questId) return;
      const next = { ...loadQuestState(), [questId]: true };
      saveQuestState(next);
      setQuestState(next);
    };
    window.addEventListener("smdflow-quest-done", handleQuestDone);
    return () => window.removeEventListener("smdflow-quest-done", handleQuestDone);
  }, []);

  const claimReward = () => {
    if (rewarded) return;
    setRewardAnimating(true);
    setTimeout(() => {
      setRewarded(true);
      setRewardAnimating(false);
      window.dispatchEvent(new CustomEvent("smdflow-sale", { detail: { value: "Recompensa Resgatada! +10 Pontos SMD" } }));
    }, 1200);
  };

  return (
    <div className="w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Trophy className="size-4 text-amber-300 animate-bounce" /> Missões do Dia
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full font-bold">
            {completedCount}/{quests.length}
          </span>
          <button onClick={onClose} className="hover:opacity-80 transition">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${(completedCount / quests.length) * 100}%` }}
        />
      </div>

      {/* Quests list */}
      <div className="p-3 space-y-2">
        {quests.map((q) => {
          const IconComp = q.icon;
          return (
            <div
              key={q.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                q.completed
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-slate-800/60 border-slate-700/50 hover:border-purple-500/50"
              }`}
            >
              <div
                className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                  q.completed ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {q.completed ? <CheckCircle2 className="size-4" /> : <IconComp className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${q.completed ? "line-through text-slate-400" : "text-slate-100"}`}>
                  {q.label}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{q.description}</p>
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${q.completed ? "text-emerald-400" : "text-amber-400"}`}>
                +{q.points} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 pt-0">
        {allCompleted && !rewarded ? (
          <button
            onClick={claimReward}
            disabled={rewardAnimating}
            className="w-full py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Gift className={`size-4 ${rewardAnimating ? "animate-bounce" : ""}`} />
            {rewardAnimating ? "Resgatando..." : "🎁 Resgatar Bônus!"}
          </button>
        ) : rewarded ? (
          <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="size-4" /> Missões Concluídas!
          </div>
        ) : (
          <div className="text-center text-[10px] text-slate-400">
            Conclua todas as missões para liberar o selo diário de Super Revendedor.
          </div>
        )}
      </div>
    </div>
  );
}

export function completeQuest(questId) {
  const todayKey = getTodayKey();
  let questState = {};
  try {
    const raw = localStorage.getItem(todayKey);
    if (raw) questState = JSON.parse(raw);
  } catch {}

  if (!questState[questId]) {
    questState[questId] = true;
    localStorage.setItem(todayKey, JSON.stringify(questState));
    window.dispatchEvent(new CustomEvent("smdflow-quest-done", { detail: { questId } }));
  }
}
