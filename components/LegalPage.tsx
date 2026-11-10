import Link from 'next/link';
import { Terminal } from 'lucide-react';

/** Shared layout for the Privacy Policy and Terms pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090D1A] text-white">
      <header className="border-b border-[rgba(148,163,184,0.12)] bg-[#090D1A]/90">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00EA64] text-[#090D1A]">
              <Terminal className="h-4 w-4" />
            </span>
            <span className="font-black tracking-tight">DashCode</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-sm leading-relaxed text-[#CBD5E1] [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#00EA64] [&_a]:underline">
        <div>
          <h1 className="text-2xl font-black text-white">{title}</h1>
          <p className="mt-1 text-xs text-[#64748B]">Last updated: {updated}</p>
        </div>
        {children}
        <p className="pt-6 text-xs text-[#64748B]">
          <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Use</Link> · <Link href="/">Home</Link>
        </p>
      </main>
    </div>
  );
}
