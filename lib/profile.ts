import { supabaseAdmin } from './db';

export interface PublicProfile {
  bio: string;
  status: string;
  github: string;
  linkedin: string;
}

export const PROFILE_LIMITS = { bio: 280, status: 40 };

/** Extracts a GitHub username from a username or profile URL. */
export function cleanGithub(input: string): string {
  const v = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').split(/[/?#]/)[0].replace(/^@/, '');
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(v) ? v : '';
}

/** Extracts a LinkedIn profile slug from a slug or profile URL. */
export function cleanLinkedin(input: string): string {
  const v = input.trim().replace(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\//i, '').split(/[/?#]/)[0];
  return /^[A-Za-z0-9\-_%]{3,100}$/.test(v) ? v : '';
}

/** Profile fields from public.users; null if not set or the migration hasn't been run. */
export async function getProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('bio, status_text, github, linkedin')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    bio: data.bio || '',
    status: data.status_text || '',
    github: data.github || '',
    linkedin: data.linkedin || '',
  };
}
