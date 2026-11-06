import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/db';
import { requireSessionUser } from '@/lib/auth';
import { PROFILE_LIMITS, cleanGithub, cleanLinkedin } from '@/lib/profile';

/** Updates the logged-in user's public bio, status and social links. */
export async function PATCH(req: NextRequest) {
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in to edit your profile.' }, { status: 401 });

  let body: { bio?: string; status?: string; github?: string; linkedin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const github = cleanGithub(body.github || '');
  const linkedin = cleanLinkedin(body.linkedin || '');
  if (body.github?.trim() && !github) {
    return NextResponse.json({ success: false, error: 'That GitHub username looks invalid.' }, { status: 400 });
  }
  if (body.linkedin?.trim() && !linkedin) {
    return NextResponse.json({ success: false, error: 'That LinkedIn profile looks invalid.' }, { status: 400 });
  }

  const update = {
    bio: (body.bio || '').trim().slice(0, PROFILE_LIMITS.bio),
    status_text: (body.status || '').trim().slice(0, PROFILE_LIMITS.status),
    github,
    linkedin,
  };
  const { error } = await supabaseAdmin.from('users').update(update).eq('id', user.id);
  if (error) {
    const missing = /column .* does not exist|Could not find the '.*' column/i.test(error.message);
    return NextResponse.json(
      {
        success: false,
        error: missing
          ? 'Profile fields are not set up yet: run supabase/migrations/002_clans_profiles.sql in Supabase.'
          : 'Could not save your profile.',
      },
      { status: missing ? 503 : 500 }
    );
  }

  try {
    revalidatePath(`/u/${user.username}`);
  } catch {
    // ignore
  }
  return NextResponse.json({ success: true, profile: { bio: update.bio, status: update.status_text, github, linkedin } });
}
