'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Edit3,
  Check,
  Share2,
  X,
  Loader2,
} from 'lucide-react';
import type { PublicProfile } from '@/lib/profile';

interface ProfileHeroProps {
  username: string;
  rpgTitle: string;
  rpgLevel: number;
  isEditable?: boolean;
  /** Saved profile from the database (null when the user hasn't filled it in yet) */
  initialProfile?: PublicProfile | null;
}

const DEFAULT_BIO = 'Competitive programmer & problem solver passionate about algorithms and systems.';
const DEFAULT_STATUS = 'Open to Opportunities';

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  username,
  rpgTitle,
  rpgLevel,
  isEditable = false,
  initialProfile = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState<PublicProfile>({
    bio: initialProfile?.bio || DEFAULT_BIO,
    status: initialProfile?.status || DEFAULT_STATUS,
    github: initialProfile?.github || '',
    linkedin: initialProfile?.linkedin || '',
  });
  const [bio, setBio] = useState(saved.bio);
  const [status, setStatus] = useState(saved.status);
  const [githubUser, setGithubUser] = useState(saved.github);
  const [linkedinUser, setLinkedinUser] = useState(saved.linkedin);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, status, github: githubUser, linkedin: linkedinUser }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Could not save your profile.');
        return;
      }
      const next: PublicProfile = {
        bio: data.profile.bio || DEFAULT_BIO,
        status: data.profile.status || DEFAULT_STATUS,
        github: data.profile.github,
        linkedin: data.profile.linkedin,
      };
      setSaved(next);
      setBio(next.bio);
      setStatus(next.status);
      setGithubUser(next.github);
      setLinkedinUser(next.linkedin);
      setIsEditing(false);
    } catch {
      setSaveError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(saved.bio);
    setStatus(saved.status);
    setGithubUser(saved.github);
    setLinkedinUser(saved.linkedin);
    setSaveError('');
    setIsEditing(false);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      // Always share the public profile, even when viewing from the private dashboard
      navigator.clipboard.writeText(`${window.location.origin}/u/${encodeURIComponent(username)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-gradient-to-r from-[#0B1739] via-[#0A1330] to-[#0B1739] p-6 sm:p-7 shadow-xl">
      <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#0E43FB]/15 via-[#00C2FF]/10 to-[#14CA74]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Avatar & Info */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#0E43FB] via-[#00C2FF] to-[#14CA74] p-0.5 shadow-[0_0_25px_rgba(0,194,255,0.35)] flex-shrink-0">
            <div className="flex h-full w-full items-center justify-center rounded-3xl bg-[#081028] text-2xl font-black text-white font-mono">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-xl bg-[#0E43FB] border-2 border-[#081028] text-[10px] font-black text-white">
              {rpgLevel}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                @{username}
              </h2>

              {/* Status Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14CA74]/40 bg-[#14CA74]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#14CA74]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14CA74] animate-pulse" />
                <span>{saved.status}</span>
              </span>
            </div>

            {/* Title & RPG Level */}
            <p className="text-xs font-mono font-bold text-[#00C2FF]">
              Level {rpgLevel} • {rpgTitle}
            </p>

            {/* Bio */}
            {!isEditing ? (
              <p className="text-xs sm:text-sm text-[#AEB9E1] max-w-xl leading-relaxed">
                {saved.bio}
              </p>
            ) : (
              <div className="space-y-2 pt-1 max-w-lg">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  rows={2}
                  placeholder="Your technical bio..."
                  className="w-full resize-none rounded-xl border border-[rgba(126,137,172,0.25)] bg-[#081028] px-3 py-1.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Status (e.g. Open to SDE)"
                    className="rounded-xl border border-[rgba(126,137,172,0.25)] bg-[#081028] px-3 py-1.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    placeholder="GitHub username"
                    className="rounded-xl border border-[rgba(126,137,172,0.25)] bg-[#081028] px-3 py-1.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={linkedinUser}
                    onChange={(e) => setLinkedinUser(e.target.value)}
                    placeholder="LinkedIn profile URL or slug"
                    className="col-span-2 rounded-xl border border-[rgba(126,137,172,0.25)] bg-[#081028] px-3 py-1.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>
                {saveError && <p className="text-[11px] text-[#FF5A65]">{saveError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Right: Social Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {saved.linkedin && (
            <a
              href={`https://www.linkedin.com/in/${saved.linkedin}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] transition hover:border-[#00C2FF] hover:text-white"
              title="LinkedIn Profile"
            >
              <Briefcase className="h-4 w-4" />
            </a>
          )}

          {saved.github && (
            <a
              href={`https://github.com/${saved.github}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] transition hover:border-[#00C2FF] hover:text-white"
              title="GitHub Profile"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          )}

          <button
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] transition hover:border-[#00C2FF] hover:text-white"
            title="Copy Public Profile URL"
          >
            {copied ? <Check className="h-4 w-4 text-[#14CA74]" /> : <Share2 className="h-4 w-4" />}
          </button>

          {isEditable && isEditing && (
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] transition hover:text-white"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {isEditable && (
            <button
              disabled={saving}
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                isEditing
                  ? 'border-[#14CA74] bg-[#14CA74]/15 text-[#14CA74]'
                  : 'border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] hover:border-[#00C2FF] hover:text-white'
              }`}
            >
              {isEditing ? (
                <>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
