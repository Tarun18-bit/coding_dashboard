'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export const AiReviewer: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetSample>(PRESET_SAMPLES[0]);
  const [code, setCode] = useState(PRESET_SAMPLES[0].code);
  const [language, setLanguage] = useState(PRESET_SAMPLES[0].language);
  const [company, setCompany] = useState(PRESET_SAMPLES[0].company);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(() =>
    analyzeSolutionLocally(PRESET_SAMPLES[0].code, PRESET_SAMPLES[0].language, PRESET_SAMPLES[0].company)
  );
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [isOptimalRevealed, setIsOptimalRevealed] = useState(false);
  const [copiedOptimal, setCopiedOptimal] = useState(false);

  const handleSelectPreset = (preset: PresetSample) => {
    setSelectedPreset(preset);
    setCode(preset.code);
    setLanguage(preset.language);
    setCompany(preset.company);
    setIsOptimalRevealed(false);
    setResult(analyzeSolutionLocally(preset.code, preset.language, preset.company));
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setIsOptimalRevealed(false);
    setTimeout(() => {
      setResult(analyzeSolutionLocally(code, language, company));
      setIsAnalyzing(false);
    }, 400);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOptimal = () => {
    if (result?.optimizedCode) {
      navigator.clipboard.writeText(result.optimizedCode);
      setCopiedOptimal(true);
      setTimeout(() => setCopiedOptimal(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#0E43FB]/15 via-[#CB3CFF]/10 to-[#00C2FF]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00C2FF]/30 bg-[#00C2FF]/10 px-3 py-1 text-xs font-bold text-[#00C2FF]">
              <Bot className="h-3.5 w-3.5" />
              <span>AI Coding Copilot &amp; Reviewer</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Solution Complexity &amp; Interview Reviewer
            </h1>
            <p className="text-xs md:text-sm text-[#AEB9E1] max-w-2xl leading-relaxed">
              Paste your solution or test a canonical problem. DashCode computes exact Big-O Time &amp; Space complexities, spots memory bottlenecks, and generates real follow-up questions asked by FAANG interviewers.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase text-[#7E89AC]">Load Sample Solution:</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SAMPLES.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => handleSelectPreset(preset)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedPreset.title === preset.title
                      ? 'border-[#00C2FF] bg-[#00C2FF]/15 text-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                      : 'border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] hover:text-white'
                  }`}
                >
                  {preset.title.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Editor */}
        <div className="lg:col-span-6 flex flex-col rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(126,137,172,0.14)] pb-3.5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#00C2FF]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Source Code</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </select>

              {/* Company Context */}
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="Google">Google Focus</option>
                <option value="Amazon">Amazon Focus</option>
                <option value="Meta">Meta Focus</option>
                <option value="Microsoft">Microsoft Focus</option>
                <option value="General">General / FAANG</option>
              </select>

              <button
                onClick={handleCopyCode}
                className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] p-1.5 text-[#AEB9E1] hover:text-white transition"
                title="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#14CA74]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Textarea Code Input */}
          <div className="relative flex-1 min-h-[360px] rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#081028] p-4 font-mono text-xs text-[#D1DBF9]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your solution code here..."
              className="h-full w-full bg-transparent resize-none focus:outline-none leading-relaxed placeholder-[#7E89AC]/60"
              rows={18}
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-[#7E89AC]">
              {code.split('\n').length} lines • {code.length} characters
            </p>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] px-6 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(14,67,251,0.5)] transition hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing AST &amp; Big-O...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run AI Code Review</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Insights & Follow-Ups */}
        <div className="lg:col-span-6 space-y-5">
          {result ? (
            <>
              {/* Verdict & Score Card */}
              <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase font-mono shadow-sm ${
                        result.verdict === 'Optimal'
                          ? 'border border-[#14CA74]/40 bg-[#14CA74]/15 text-[#14CA74]'
                          : 'border border-[#FDB52A]/40 bg-[#FDB52A]/15 text-[#FDB52A]'
                      }`}
                    >
                      {result.verdict} Complexity
                    </span>
                    <span className="text-xs text-[#7E89AC]">for {company} Interview</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7E89AC] uppercase font-bold">Code Score:</span>
                    <span className="text-xl font-black font-mono text-white">
                      {result.qualityScore}
                      <span className="text-xs text-[#7E89AC]">/100</span>
                    </span>
                  </div>
                </div>

                {/* Big-O Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00C2FF] mb-1">
                      <Clock className="h-4 w-4" />
                      <span>Time Complexity</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-white tracking-wide">
                      {result.timeComplexity}
                    </p>
                    <p className="text-[11px] text-[#AEB9E1] mt-1.5 leading-snug">
                      {result.timeExplanation}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#CB3CFF] mb-1">
                      <HardDrive className="h-4 w-4" />
                      <span>Space Complexity</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-white tracking-wide">
                      {result.spaceComplexity}
                    </p>
                    <p className="text-[11px] text-[#AEB9E1] mt-1.5 leading-snug">
                      {result.spaceExplanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strengths & Edge Cases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#14CA74] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Key Strengths</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#D1DBF9]">
                    {result.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#14CA74] mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Edge Cases */}
                <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FF5A65] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Edge Cases to Watch</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#D1DBF9]">
                    {result.edgeCasesToWatch.map((edge, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#FF5A65] mt-0.5">•</span>
                        <span>{edge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Optimal Solution Reveal Section */}
              {!isOptimalRevealed ? (
                <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl text-center space-y-3.5 relative overflow-hidden">
                  <div className="absolute right-0 top-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-[#14CA74]/10 blur-2xl pointer-events-none" />
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A1330] border border-[rgba(126,137,172,0.2)] text-[#FDB52A]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="rounded-md border border-[#FDB52A]/40 bg-[#FDB52A]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#FDB52A] uppercase">
                        Optimal Code Concealed
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white">
                      Want to see the AI Optimized Implementation?
                    </h3>
                    <p className="text-xs text-[#AEB9E1] max-w-md mx-auto mt-0.5">
                      Try to think through the optimization yourself using the Big-O analysis above. Reveal whenever you want to compare your logic with the optimal pattern.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOptimalRevealed(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#14CA74] to-[#00C2FF] px-5 py-2.5 text-xs font-bold text-[#081028] shadow-[0_0_20px_rgba(20,202,116,0.4)] transition hover:scale-105 active:scale-95"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Reveal Optimal Solution</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl border border-[#14CA74]/40 bg-[#0B1739] p-5 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#14CA74]" />
                      <h3 className="text-sm font-bold text-white">AI Optimal Implementation</h3>
                      <span className="rounded-md bg-[#14CA74]/15 border border-[#14CA74]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#14CA74] uppercase">
                        Optimal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyOptimal}
                        className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-2.5 py-1 text-[11px] font-mono text-[#AEB9E1] hover:text-white transition flex items-center gap-1.5"
                      >
                        {copiedOptimal ? <Check className="h-3.5 w-3.5 text-[#14CA74]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedOptimal ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => setIsOptimalRevealed(false)}
                        className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-2.5 py-1 text-[11px] font-mono text-[#AEB9E1] hover:text-white transition flex items-center gap-1.5"
                        title="Conceal solution again"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Hide</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#081028] p-4 font-mono text-xs text-[#14CA74] overflow-x-auto">
                    <pre>{result.optimizedCode}</pre>
                  </div>

                  <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] p-3.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#00C2FF] block mb-1">
                      Key Transformations &amp; Why This is Optimal:
                    </span>
                    <p className="text-[#D1DBF9] leading-relaxed">
                      {result.optimizationSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Interviewer Follow-Up Questions (FAANG Drill) */}
              <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#FDB52A]" />
                    <h3 className="text-sm font-bold text-white">
                      FAANG Interview Follow-Up Questions ({company})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#7E89AC]">5 Questions Prepared</span>
                </div>

                <div className="space-y-2.5">
                  {result.followUpQuestions.map((item, idx) => {
                    const isExpanded = expandedQuestion === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[rgba(126,137,172,0.14)] bg-[#0A1330] overflow-hidden transition"
                      >
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#081028]/50 transition"
                        >
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="rounded-md bg-[#0E43FB]/20 text-[#00C2FF] px-1.5 py-0.5 font-mono text-[10px]">
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
                          <div className="px-4 pb-4 pt-1 border-t border-[rgba(126,137,172,0.1)] space-y-2.5 text-xs bg-[#081028]/40">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#7E89AC]">
                                What the Interviewer is Evaluating:
                              </span>
                              <p className="text-[#AEB9E1] mt-0.5">{item.interviewerIntent}</p>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#14CA74]">
                                Recommended Answer Strategy:
                              </span>
                              <p className="text-white mt-0.5 font-medium">{item.suggestedApproach}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-12 text-center text-sm text-[#AEB9E1]">
              Click &quot;Run AI Code Review&quot; to inspect your solution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
