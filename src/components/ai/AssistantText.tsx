import { Fragment } from 'react'
import { blocks, spans, type Span } from './assistantMarkdown'

/**
 * Renders one assistant message. The parsing lives in `assistantMarkdown.ts`;
 * this turns its spans into React nodes, so model output can never become
 * markup.
 */

function renderSpans(line: string, keyPrefix: string) {
  return spans(line).map((span: Span, i: number) => {
    const key = `${keyPrefix}-${i}`
    if (span.kind === 'bold') return <strong key={key}>{span.value}</strong>
    if (span.kind === 'italic') return <em key={key}>{span.value}</em>
    if (span.kind === 'code') {
      return (
        <code key={key} className="rounded bg-dark/5 px-1 py-0.5 text-[0.9em] dark:bg-white/10">
          {span.value}
        </code>
      )
    }
    return <Fragment key={key}>{span.value}</Fragment>
  })
}

export default function AssistantText({ text }: { text: string }) {
  if (!text.trim()) return null

  return (
    <div className="flex flex-col gap-3 text-dark dark:text-white">
      {blocks(text).map((block, i) =>
        block.kind === 'ul' ? (
          <ul key={i} className="flex list-disc flex-col gap-1 pl-5 marker:text-primary">
            {block.items.map((item, j) => (
              <li key={j}>{renderSpans(item, `${i}-${j}`)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {renderSpans(line, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  )
}
