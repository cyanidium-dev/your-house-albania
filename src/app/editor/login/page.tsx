import { redirect } from 'next/navigation';
import { getEditorSession } from '@/features/editor/auth/getEditorSession';
import { editorAuthConfigured } from '@/features/editor/auth/signCookie';
import { EditorLoginForm } from '@/features/editor/components/EditorLoginForm';

export const dynamic = 'force-dynamic';

export default async function EditorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getEditorSession();
  const { next } = await searchParams;
  const safeNext = typeof next === 'string' && next.startsWith('/editor') ? next : '/editor';

  if (session.authenticated) {
    redirect(safeNext);
  }

  const configured = editorAuthConfigured();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Domlivo Editor</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to edit landing pages.</p>

        {!configured ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {/* Setup details live in .env.example (editor section) — never print env-var names publicly. */}
            Editor is not available on this deployment.
          </div>
        ) : (
          <EditorLoginForm next={safeNext} />
        )}
      </div>
    </main>
  );
}
