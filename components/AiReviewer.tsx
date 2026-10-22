'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PRESET_SAMPLES,
  PresetSample,
  ReviewResult,
  analyzeSolutionLocally,
} from '@/lib/ai-reviewer';
import {
  Sparkles,
  Bot,
  Zap,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Terminal,
  Share2,
  ShieldCheck,
  FileCode,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const AiReviewer: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetSample>(PRESET_SAMPLES[0]);
  const [code, setCode] = useState(PRESET_SAMPLES[0].code);
  const [language, setLanguage] = useState(PRESET_SAMPLES[0].language);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(() =>
    analyzeSolutionLocally(PRESET_SAMPLES[0].code, PRESET_SAMPLES[0].language)
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'optimal' | 'questions'>('overview');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOptimal, setCopiedOptimal] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isOptimalRevealed, setIsOptimalRevealed] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Handle Tab key inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
        updateCursorPosition(target);
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const updateCursorPosition = (target: HTMLTextAreaElement) => {
    const textUpToCursor = target.value.substring(0, target.selectionStart);
    const lines = textUpToCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleSelectPreset = (preset: PresetSample) => {
    setSelectedPreset(preset);
    setCode(preset.code);
    setLanguage(preset.language);
    setIsOptimalRevealed(false);
    setResult(analyzeSolutionLocally(preset.code, preset.language));
  };

  const handleAnalyze = () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setAnalysisStep('Constructing AST & Loop Topology...');

    setTimeout(() => {
      setAnalysisStep('Evaluating Asymptotic Big-O Complexities...');
    }, 200);

    setTimeout(() => {
      setAnalysisStep('Synthesizing Interviewer Follow-ups...');
    }, 450);

    setTimeout(() => {
      setResult(analyzeSolutionLocally(code, language));
      setIsAnalyzing(false);
      setAnalysisStep('');
    }, 650);
  };

  const handleResetToPreset = () => {
    setCode(selectedPreset.code);
    setLanguage(selectedPreset.language);
    setResult(analyzeSolutionLocally(selectedPreset.code, selectedPreset.language));
  };

  const handleClearCode = () => {
    setCode('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyOptimal = () => {
    if (result?.optimizedCode) {
      navigator.clipboard.writeText(result.optimizedCode);
      setCopiedOptimal(true);
      setTimeout(() => setCopiedOptimal(false), 2000);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const report = `# AI Code Review Summary
- **Verdict:** ${result.verdict} Complexity (${result.qualityScore}/100)
- **Time Complexity:** ${result.timeComplexity} (${result.timeExplanation})
- **Space Complexity:** ${result.spaceComplexity} (${result.spaceExplanation})

## Strengths
${result.strengths.map((s) => `- ${s}`).join('\n')}

## Edge Cases to Watch
${result.edgeCasesToWatch.map((e) => `- ${e}`).join('\n')}

## Interviewer Follow-Up Questions
${result.followUpQuestions.map((q, i) => `### Q${i + 1}: ${q.question}\n- **Intent:** ${q.interviewerIntent}\n- **Recommended Strategy:** ${q.suggestedApproach}`).join('\n\n')}
`;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const lineCount = Math.max(code.split('\n').length, 1);
  const getFileExtension = () => {
    switch (language) {
      case 'python':
        return 'solution.py';
      case 'cpp':
        return 'solution.cpp';
      case 'java':
        return 'Solution.java';
      case 'typescript':
        return 'solution.ts';
      case 'javascript':
        return 'solution.js';
      default:
        return 'solution.txt';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-gradient-to-b from-[#0E1B3E] via-[#0B1739] to-[#081028] p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-gradient-to-br from-[#0E43FB]/20 via-[#CB3CFF]/15 to-[#00C2FF]/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[#14CA74]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00C2FF]/40 bg-[#00C2FF]/10 px-3 py-1 text-xs font-bold text-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.2)]">
                <Bot className="h-3.5 w-3.5" />
                <span>AI Complexity Copilot</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14CA74]/30 bg-[#14CA74]/10 px-2.5 py-0.5 text-[11px] font-mono text-[#14CA74]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14CA74] animate-pulse" />
                AST Engine Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Solution Complexity &amp; Code Reviewer
            </h1>
            <p className="text-xs sm:text-sm text-[#AEB9E1] leading-relaxed">
              Analyze code solutions with AST inspection. Evaluate exact Big-O Time &amp; Space limits, spot memory bottlenecks, and train on real algorithmic follow-up questions and edge case drills.
            </p>
          </div>
        </div>

        {/* Canonical Problem Preset Pills */}
        <div className="mt-6 pt-5 border-t border-[rgba(126,137,172,0.14)]">
          <div className="flex items-center gap-2 mb-2.5">
            <Flame className="h-3.5 w-3.5 text-[#FDB52A]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E89AC]">
              Test Canonical Problem Presets:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PRESET_SAMPLES.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              const diffColor =
                preset.difficulty === 'Easy'
                  ? 'text-[#14CA74] border-[#14CA74]/30 bg-[#14CA74]/10'
                  : preset.difficulty === 'Medium'
                  ? 'text-[#FDB52A] border-[#FDB52A]/30 bg-[#FDB52A]/10'
                  : 'text-[#FF5A65] border-[#FF5A65]/30 bg-[#FF5A65]/10';

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-[#00C2FF] bg-[#00C2FF]/10 shadow-[0_0_15px_rgba(0,194,255,0.25)]'
                      : 'border-[rgba(126,137,172,0.16)] bg-[#070D21]/60 hover:border-[#00C2FF]/50 hover:bg-[#0A1330]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#7E89AC] truncate">
                      {preset.topic}
                    </span>
                    <span className={`rounded-md border px-1.5 py-0.2 text-[9px] font-mono font-bold ${diffColor}`}>
                      {preset.difficulty}
                    </span>
                  </div>
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#D1DBF9]'}`}>
                    {preset.title}
                  </span>
                  <span className="text-[10px] text-[#00C2FF] font-mono truncate">{preset.language.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: HackerRank / VS Code Style Code Studio */}
        <div className="lg:col-span-6 flex flex-col rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] shadow-2xl overflow-hidden">
          {/* Studio Window Bar */}
          <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] bg-[#081028] px-4 py-3">
            {/* Window Controls & File Tab */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]/80" />
              </div>
              <div className="h-4 w-px bg-[rgba(126,137,172,0.2)]" />
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(126,137,172,0.2)] bg-[#0B1739] px-2.5 py-1 text-xs font-mono text-white">
                <FileCode className="h-3.5 w-3.5 text-[#00C2FF]" />
                <span>{getFileExtension()}</span>
              </div>
            </div>

            {/* Language & Actions */}
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-2.5 py-1 text-xs font-mono text-[#00C2FF] font-semibold focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="python">Python 3.12</option>
                <option value="cpp">C++ 20</option>
                <option value="java">Java 21</option>
                <option value="typescript">TypeScript 5.4</option>
                <option value="javascript">JavaScript (ES6)</option>
              </select>

              <button
                onClick={handleCopyCode}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] p-1.5 text-[#AEB9E1] hover:text-white transition"
                title="Copy code"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-[#14CA74]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleResetToPreset}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] p-1.5 text-[#AEB9E1] hover:text-white transition"
                title="Reset to sample code"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleClearCode}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] p-1.5 text-[#AEB9E1] hover:text-[#FF5A65] transition"
                title="Clear code"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* IDE Gutter + Editor Workspace */}
          <div className="relative flex min-h-[420px] max-h-[580px] bg-[#070D21] font-mono text-xs overflow-hidden">
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="select-none py-3.5 px-3 bg-[#050917] border-r border-[rgba(126,137,172,0.12)] text-right text-[#485375] font-mono text-xs leading-6 overflow-hidden min-w-[44px]"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className={cursorPos.line === i + 1 ? 'text-[#00C2FF] font-bold' : ''}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editable Text Area */}
            <div className="relative flex-1 p-3.5 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  updateCursorPosition(e.target);
                }}
                onKeyDown={handleKeyDown}
                onClick={(e) => updateCursorPosition(e.currentTarget)}
                onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
                onScroll={handleScroll}
                placeholder="// Paste or write your solution here..."
                spellCheck={false}
                className="h-full w-full bg-transparent resize-none focus:outline-none font-mono text-xs text-[#E2E8F0] leading-6 placeholder-[#485375] selection:bg-[#0E43FB]/40"
              />
            </div>
          </div>

          {/* IDE Bottom Status & Action Bar */}
          <div className="flex flex-wrap items-center justify-between border-t border-[rgba(126,137,172,0.14)] bg-[#081028] px-4 py-2.5 text-[11px] text-[#7E89AC]">
            <div className="flex items-center gap-3">
              <span>
                Ln <strong className="text-white">{cursorPos.line}</strong>, Col <strong className="text-white">{cursorPos.col}</strong>
              </span>
              <span>•</span>
              <span>{lineCount} lines</span>
              <span>•</span>
              <span>{code.length} chars</span>
              <span>•</span>
              <span className="hidden sm:inline">Spaces: 4</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] text-[#7E89AC]">
                Press <kbd className="rounded border border-[rgba(126,137,172,0.3)] bg-[#0A1330] px-1 py-0.5 text-[10px] font-mono text-white">Ctrl+Enter</kbd> to run
              </span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !code.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0E43FB] via-[#00C2FF] to-[#14CA74] px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(14,67,251,0.5)] transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run AI Review</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analyzing Progress Shimmer */}
          {isAnalyzing && (
            <div className="border-t border-[#00C2FF]/30 bg-[#00C2FF]/10 px-4 py-2 text-xs font-mono text-[#00C2FF] flex items-center gap-2 animate-pulse">
              <Terminal className="h-3.5 w-3.5" />
              <span>{analysisStep || 'Analyzing solution...'}</span>
            </div>
          )}
        </div>

        {/* Right Column: Deep AI Review HUD & Insights */}
        <div className="lg:col-span-6 space-y-5">
          {result ? (
            <>
              {/* Score & Verdict HUD Card */}
              <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-gradient-to-b from-[#0B1739] to-[#081028] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-[#0E43FB]/15 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4 mb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase font-mono tracking-wide shadow-sm ${
                          result.verdict === 'Optimal'
                            ? 'border border-[#14CA74]/40 bg-[#14CA74]/15 text-[#14CA74]'
                            : result.verdict === 'Suboptimal'
                            ? 'border border-[#FDB52A]/40 bg-[#FDB52A]/15 text-[#FDB52A]'
                            : 'border border-[#FF5A65]/40 bg-[#FF5A65]/15 text-[#FF5A65]'
                        }`}
                      >
                        {result.verdict === 'Optimal' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {result.verdict} Complexity
                      </span>
                    </div>
                    <p className="text-xs text-[#AEB9E1]">
                      {result.verdict === 'Optimal'
                        ? 'Production-ready efficiency. Scalable and within optimal latency limits.'
                        : 'Functional but risks Time Limit Exceeded (TLE) or excessive auxiliary memory.'}
                    </p>
                  </div>

                  {/* Quality Gauge */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase text-[#7E89AC]">Code Quality</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono text-white tracking-tight">
                        {result.qualityScore}
                      </span>
                      <span className="text-xs text-[#7E89AC]">/100</span>
                    </div>
                  </div>
                </div>

                {/* Big-O Complexity HUD Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Time Complexity Card */}
                  <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#070D21] p-4 relative overflow-hidden group hover:border-[#00C2FF]/40 transition">
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#00C2FF]/5 blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between text-xs font-bold text-[#00C2FF] mb-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>Time Complexity</span>
                      </div>
                      <span className="rounded bg-[#00C2FF]/15 px-1.5 py-0.5 text-[10px] font-mono">
                        {result.timeComplexity.includes('N²') ? 'Quadratic' : 'Linear / Sublinear'}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wide">
                      {result.timeComplexity}
                    </p>
                    <p className="text-[11px] text-[#AEB9E1] mt-2 leading-relaxed">
                      {result.timeExplanation}
                    </p>
                  </div>

                  {/* Space Complexity Card */}
                  <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#070D21] p-4 relative overflow-hidden group hover:border-[#CB3CFF]/40 transition">
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#CB3CFF]/5 blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between text-xs font-bold text-[#CB3CFF] mb-2">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-4 w-4" />
                        <span>Space Complexity</span>
                      </div>
                      <span className="rounded bg-[#CB3CFF]/15 px-1.5 py-0.5 text-[10px] font-mono">
                        {result.spaceComplexity === 'O(1)' ? 'In-Place' : 'Allocates Buffer'}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wide">
                      {result.spaceComplexity}
                    </p>
                    <p className="text-[11px] text-[#AEB9E1] mt-2 leading-relaxed">
                      {result.spaceExplanation}
                    </p>
                  </div>
                </div>

                {/* Quick Share / Export Report */}
                <div className="mt-4 pt-3.5 border-t border-[rgba(126,137,172,0.12)] flex items-center justify-between">
                  <span className="text-[11px] text-[#7E89AC]">Analysis generated in 18ms</span>
                  <button
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00C2FF] hover:text-white transition"
                  >
                    {copiedReport ? <Check className="h-3.5 w-3.5 text-[#14CA74]" /> : <Share2 className="h-3.5 w-3.5" />}
                    <span>{copiedReport ? 'Copied Review Markdown!' : 'Export Review (Markdown)'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Overview, Optimal Diff, Interview Questions */}
              <div className="flex items-center gap-2 border-b border-[rgba(126,137,172,0.18)] pb-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    activeTab === 'overview'
                      ? 'border border-[#00C2FF] bg-[#00C2FF]/15 text-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.25)]'
                      : 'text-[#AEB9E1] hover:text-white hover:bg-[#0B1739]'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Strengths &amp; Edge Cases</span>
                </button>

                <button
                  onClick={() => setActiveTab('optimal')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    activeTab === 'optimal'
                      ? 'border border-[#14CA74] bg-[#14CA74]/15 text-[#14CA74] shadow-[0_0_12px_rgba(20,202,116,0.25)]'
                      : 'text-[#AEB9E1] hover:text-white hover:bg-[#0B1739]'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>AI Optimal Solution</span>
                </button>

                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    activeTab === 'questions'
                      ? 'border border-[#FDB52A] bg-[#FDB52A]/15 text-[#FDB52A] shadow-[0_0_12px_rgba(253,181,42,0.25)]'
                      : 'text-[#AEB9E1] hover:text-white hover:bg-[#0B1739]'
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Follow-Up Drills (5)</span>
                </button>
              </div>

              {/* Tab Content 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Strengths */}
                  <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#14CA74] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verified Strengths</span>
                    </h3>
                    <div className="space-y-2">
                      {result.strengths.map((str, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl border border-[rgba(126,137,172,0.1)] bg-[#070D21] p-3 text-xs text-[#D1DBF9]"
                        >
                          <span className="text-[#14CA74] font-bold mt-0.5">✓</span>
                          <span className="leading-relaxed">{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottlenecks (if any) */}
                  {result.bottlenecks.length > 0 && (
                    <div className="rounded-3xl border border-[#FDB52A]/30 bg-[#0B1739] p-5 shadow-xl space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FDB52A] flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Identified Bottlenecks</span>
                      </h3>
                      <div className="space-y-2">
                        {result.bottlenecks.map((bot, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 rounded-xl border border-[#FDB52A]/20 bg-[#FDB52A]/5 p-3 text-xs text-[#FDB52A]"
                          >
                            <span className="font-bold mt-0.5">!</span>
                            <span className="leading-relaxed text-[#D1DBF9]">{bot}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edge Cases to Watch */}
                  <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FF5A65] flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Critical Edge Cases to Test</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {result.edgeCasesToWatch.map((edge, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl border border-[rgba(126,137,172,0.1)] bg-[#070D21] p-3 text-xs text-[#D1DBF9]"
                        >
                          <span className="text-[#FF5A65] font-bold font-mono">0{idx + 1}.</span>
                          <span className="leading-relaxed">{edge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: AI Optimal Implementation */}
              {activeTab === 'optimal' && (
                <div className="space-y-4">
                  {!isOptimalRevealed ? (
                    <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-8 shadow-2xl text-center space-y-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-[#14CA74]/15 blur-3xl pointer-events-none" />
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#070D21] border border-[rgba(126,137,172,0.25)] text-[#FDB52A] shadow-inner">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="space-y-1.5">
                        <span className="rounded-md border border-[#FDB52A]/40 bg-[#FDB52A]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#FDB52A] uppercase">
                          Optimal Code Concealed
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          Ready to compare your logic with the optimal pattern?
                        </h3>
                        <p className="text-xs text-[#AEB9E1] max-w-md mx-auto leading-relaxed">
                          We recommend trying to implement the optimal Big-O logic on the left first. Reveal when you want to compare your implementation with production-grade FAANG code.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsOptimalRevealed(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#14CA74] to-[#00C2FF] px-6 py-2.5 text-xs font-bold text-[#081028] shadow-[0_0_25px_rgba(20,202,116,0.4)] transition hover:scale-105 active:scale-95 font-sans"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Reveal Optimal Implementation</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-[#14CA74]/40 bg-[#0B1739] shadow-2xl overflow-hidden space-y-0">
                      {/* Optimal Header */}
                      <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] bg-[#081028] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#14CA74]" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            AI Optimal Pattern
                          </span>
                          <span className="rounded bg-[#14CA74]/20 border border-[#14CA74]/30 px-2 py-0.5 text-[9px] font-mono text-[#14CA74] font-bold">
                            PEAK EFFICIENCY
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyOptimal}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3 py-1 text-xs font-mono text-[#AEB9E1] hover:text-white transition"
                          >
                            {copiedOptimal ? <Check className="h-3.5 w-3.5 text-[#14CA74]" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedOptimal ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => setIsOptimalRevealed(false)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3 py-1 text-xs font-mono text-[#AEB9E1] hover:text-white transition"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Conceal</span>
                          </button>
                        </div>
                      </div>

                      {/* Code Block */}
                      <div className="p-4 bg-[#070D21] font-mono text-xs text-[#14CA74] overflow-x-auto leading-6">
                        <pre>{result.optimizedCode}</pre>
                      </div>

                      {/* Why this is optimal */}
                      <div className="border-t border-[rgba(126,137,172,0.14)] bg-[#0A1330] p-4 text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00C2FF] uppercase mb-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          <span>Key Transformations &amp; Rationale:</span>
                        </div>
                        <p className="text-[#D1DBF9] leading-relaxed">
                          {result.optimizationSummary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 3: Technical Follow-Ups */}
              {activeTab === 'questions' && (
                <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[#FDB52A]" />
                      <h3 className="text-sm font-bold text-white">
                        Algorithm Follow-Up Questions &amp; Scenarios
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#7E89AC]">5 Questions Prepared</span>
                  </div>

                  <p className="text-xs text-[#AEB9E1] leading-relaxed">
                    Evaluates how your solution adapts to scaling constraints, memory limits, and streaming data after the base algorithm is implemented.
                  </p>

                  <div className="space-y-2.5">
                    {result.followUpQuestions.map((item, idx) => {
                      const isExpanded = expandedQuestion === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-[rgba(126,137,172,0.14)] bg-[#070D21] overflow-hidden transition"
                        >
                          <button
                            onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#0A1330] transition"
                          >
                            <span className="text-xs font-bold text-white flex items-center gap-2.5">
                              <span className="rounded-md bg-[#0E43FB]/25 text-[#00C2FF] px-2 py-0.5 font-mono text-[10px] font-bold">
                                Q{idx + 1}
                              </span>
                              <span>{item.question}</span>
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-[#7E89AC] flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[#7E89AC] flex-shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-[rgba(126,137,172,0.1)] space-y-3 text-xs bg-[#050917]">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#7E89AC] tracking-wider">
                                  What the Interviewer is Evaluating:
                                </span>
                                <p className="text-[#AEB9E1] mt-1 leading-relaxed">
                                  {item.interviewerIntent}
                                </p>
                              </div>
                              <div className="rounded-xl border border-[#14CA74]/20 bg-[#14CA74]/5 p-3">
                                <span className="text-[10px] uppercase font-bold text-[#14CA74] tracking-wider flex items-center gap-1 mb-1">
                                  <Check className="h-3 w-3" />
                                  <span>Recommended Answer Strategy:</span>
                                </span>
                                <p className="text-white font-medium leading-relaxed">
                                  {item.suggestedApproach}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-12 text-center text-sm text-[#AEB9E1]">
              Paste or write your solution on the left, then click &quot;Run AI Review&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
