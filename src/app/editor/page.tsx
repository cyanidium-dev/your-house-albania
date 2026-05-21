import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getEditorSession } from '@/features/editor/auth/getEditorSession';
import { listLandingsForEditor } from '@/features/editor/data/listLandings';
import { EditorIndexHeader } from '@/features/editor/components/EditorIndexHeader';

export const dynamic = 'force-dynamic';

export default async function EditorIndexPage() {
  const session = await getEditorSession();
  if (!session.authenticated) {
    redirect('/editor/login?next=/editor');
  }

  const landings = await listLandingsForEditor();

  return (
    <>
      <EditorIndexHeader title="Landings" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Landing pages</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {landings.length} document{landings.length === 1 ? '' : 's'} — pick one to reorder
              its sections.
            </p>
          </div>
        </div>

        {landings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            No landing pages found. Check Sanity configuration on the server.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {landings.map((l) => (
              <li key={l._id}>
                <Link
                  href={`/editor/landing/${encodeURIComponent(l._id)}`}
                  className="group flex flex-col gap-1.5 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {l.pageType ? (
                      <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        {l.pageType}
                      </span>
                    ) : null}
                    <span className="text-xs text-neutral-400">
                      {l.sectionCount} section{l.sectionCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span className="truncate text-sm font-semibold text-neutral-900 group-hover:text-black">
                    {l.title ?? l._id}
                  </span>
                  <span className="truncate text-xs text-neutral-400 font-mono">{l._id}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
