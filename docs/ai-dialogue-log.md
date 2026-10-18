# Assistant transcript log

What visitors ask the assistant — on `/[locale]/ai-search` and on a listing page —
is stored as one Sanity document per conversation, and deleted 90 days after the
conversation's last message.

## Shape

`aiDialogue`, id `ai-dialogue-<sessionId>`:

| field | what it is |
| --- | --- |
| `sessionId` | random id minted by the browser, one per conversation per tab |
| `surface` | `search` or `property` |
| `propertySlug` | the listing, when `surface` is `property` |
| `locale`, `country` | language written in; two-letter country from the Vercel edge (no IP) |
| `turns[]` | `{at, question, answer, shownSlugs[], citedIds[]}` — up to 20 exchanges |
| `turnCount`, `estimatedUsd` | counted for every exchange, including past the cap |
| `startedAt`, `updatedAt` | `updatedAt` is what retention is measured from |

## How it is written

`src/lib/ai/dialogueLog.ts`, called from the `after()` callback in
`src/app/api/ai/chat/route.ts` — the same place the budget counter is
incremented, after the answer has finished streaming. One transaction per
exchange (`createIfNotExists` + `patch`), so a two-hop answer is still one write.
Every failure is swallowed: a lost transcript never costs a visitor their answer.

The browser side is `chatSessionId()` in `src/components/ai/chatStorage.ts`. The
id lives in `sessionStorage` beside the conversation it names, and `clearChat()`
drops both, so "start over" starts a new transcript.

## Switching it off

`AI_DIALOGUE_LOG=off` stops the writes; the budget counter is unaffected. With no
Sanity write token the log is off anyway.

## Retention

`GET /api/cron/prune-ai-dialogues` deletes every conversation whose `updatedAt`
is older than 90 days, 500 per run, and is wired into `vercel.json` at 02:30
daily. It needs `CRON_SECRET`, like the currency cron. Hobby allows two cron
entries and once-a-day schedules — this is the second.

## Privacy

The policy has to match what is stored. The "Assistant conversations" section of
the `privacy` landing page states the 90 days and says not to type sensitive
details into the chat; it lives in `domlivo-admin/scripts/data/legalPages.ts`
(+ `legalPagesTranslations.ts`) and is published with
`npm run create:legal-pages -- --execute`. Change what is logged, change that
section in the same pass.
