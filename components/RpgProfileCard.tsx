'use client';

import React, { useState } from 'react';
import { RpgProfile, Badge, SkillNode } from '@/lib/gamification';
import {
  Shield,
  Zap,
  Award,
  Sparkles,
  GitBranch,
  X,
  Lock,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface RpgProfileCardProps {
  rpg: RpgProfile;
}

export const RpgProfileCard: React.FC<RpgProfileCardProps> = ({ rpg }) => {
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const unlockedBadges = rpg.badges.filter((b) => b.isUnlocked);

  // Group skill nodes by category
  const categories = ['Fundamentals', 'Algorithms', 'Data Structures', 'Advanced'];

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-6 shadow-xl">
        {/* Ambient background glow */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Level & Character Info */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB] p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0B1222] text-center font-mono">
                <div>
                  <span className="block text-[11px] font-bold uppercase text-[#7E89AC]">LVL</span>
                  <span className="text-xl font-black text-white">{rpg.level}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-2 py-0.5 text-[11px] font-mono font-bold text-[#8B5CF6] uppercase">
                  RANK TITLE
                </span>
                <span className="text-xs text-[#7E89AC] font-mono">
                  {rpg.totalXp.toLocaleString()} Total XP
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {rpg.title}
              </h2>
            </div>
          </div>

          {/* XP Progress to Next Level */}
          <div className="flex-1 max-w-md space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#AEB9E1]">Next Level Progress</span>
              <span className="text-[#00C2FF] font-bold">
                {rpg.currentLevelXp} / {rpg.nextLevelXp} XP ({rpg.xpProgressPercent}%)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.15)]">
              <div
                style={{ width: `${rpg.xpProgressPercent}%` }}
                className="h-full rounded-full bg-[#2563EB] transition-all duration-700"
              />
            </div>
          </div>

          {/* Open Skill Tree Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTreeOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(139,92,246,0.3)] bg-[#2563EB] px-5 py-3 text-xs font-bold text-white transition hover:scale-105 hover:border-[#8B5CF6]"
            >
              <GitBranch className="h-4 w-4 text-[#8B5CF6]" />
              <span>RPG Skill Tree</span>
            </button>
          </div>
        </div>

        {/* Badges Quick Showcase */}
        <div className="mt-6 border-t border-[rgba(126,137,172,0.14)] pt-5">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs uppercase font-bold text-[#7E89AC] tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#FDB52A]" />
              <span>Unlocked Achievements ({unlockedBadges.length}/{rpg.badges.length})</span>
            </span>
            <span className="text-xs text-[#AEB9E1]">Click badge to view requirements</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
            {rpg.badges.map((badge) => {
              const rarityColor =
                badge.rarity === 'Legendary'
                  ? 'border-[#FDB52A]/50 bg-[#FDB52A]/10 text-[#FDB52A]'
                  : badge.rarity === 'Epic'
                  ? 'border-[#8B5CF6]/50 bg-[#8B5CF6]/10 text-[#8B5CF6]'
                  : badge.rarity === 'Rare'
                  ? 'border-[#00C2FF]/50 bg-[#00C2FF]/10 text-[#00C2FF]'
                  : 'border-[#14CA74]/50 bg-[#14CA74]/10 text-[#14CA74]';

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                    badge.isUnlocked
                      ? `${rarityColor} hover:scale-110 shadow-lg`
                      : 'border-[rgba(126,137,172,0.12)] bg-[#0B1222]/50 opacity-40 hover:opacity-75'
                  }`}
                  title={badge.name}
                >
                  <span className="text-2xl mb-1 select-none">{badge.icon}</span>
                  <span className="text-[10px] font-bold text-center line-clamp-1 text-white">
                    {badge.name}
                  </span>
                  {!badge.isUnlocked && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0B1222] border border-[rgba(126,137,172,0.3)] text-[8px] text-[#7E89AC]">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-[rgba(126,137,172,0.2)] bg-[#0E1628] p-6 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 rounded-xl p-1.5 text-[#7E89AC] hover:bg-[#0B1222] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0B1222] border border-[rgba(126,137,172,0.2)] text-4xl shadow-inner">
              {selectedBadge.icon}
            </div>

            <div>
              <span className="rounded-md border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-2 py-0.5 text-[11px] font-mono font-bold text-[#8B5CF6] uppercase">
                {selectedBadge.rarity} Badge
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">{selectedBadge.name}</h3>
              <p className="text-xs text-[#AEB9E1] mt-1">{selectedBadge.description}</p>
            </div>

            <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0B1222] p-3 text-xs font-mono">
              <div className="flex justify-between text-[#AEB9E1] mb-1.5">
                <span>Requirement</span>
                <span className={selectedBadge.isUnlocked ? 'text-[#14CA74] font-bold' : 'text-[#AEB9E1]'}>
                  {selectedBadge.currentValue} / {selectedBadge.targetValue}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#0B1222]">
                <div
                  style={{ width: `${selectedBadge.progress}%` }}
                  className="h-full bg-[#2563EB]"
                />
              </div>
            </div>

            <p className="text-xs text-[#7E89AC]">
              {selectedBadge.isUnlocked ? '✅ Unlocked & Active' : '🔒 In Progress'}
            </p>
          </div>
        </div>
      )}

      {/* Full Skill Tree Modal */}
      {isTreeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[rgba(126,137,172,0.25)] bg-[#0E1628] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white">
                    Mastery Skill Tree
                  </h3>
                  <p className="text-xs text-[#7E89AC]">
                    Solve topic problems across platforms to rank up each mastery node from Rank I to V.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTreeOpen(false)}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] p-2 text-[#AEB9E1] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tree Categories */}
            <div className="space-y-6">
              {categories.map((category) => {
                const nodes = rpg.skillNodes.filter((n) => n.category === category);
                if (nodes.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#00C2FF] flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{category} Branch</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nodes.map((node) => {
                        return (
                          <div
                            key={node.id}
                            className={`rounded-2xl border p-4 transition ${
                              node.isUnlocked
                                ? 'border-[rgba(126,137,172,0.2)] bg-[#0B1222]'
                                : 'border-[rgba(126,137,172,0.1)] bg-[#0B1222]/60 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-white">{node.name}</span>
                              <span className="rounded-md border border-[#FDB52A]/30 bg-[#FDB52A]/10 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#FDB52A]">
                                Rank {node.level > 0 ? ['I', 'II', 'III', 'IV', 'V'][node.level - 1] : '0'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono text-[#AEB9E1] mb-2">
                              <span>Solved: {node.solvedCount}</span>
                              <span>Next: {node.requiredForNext}</span>
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0B1222]">
                              <div
                                style={{
                                  width: `${Math.min(100, (node.solvedCount / node.requiredForNext) * 100)}%`,
                                }}
                                className="h-full bg-[#2563EB]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
