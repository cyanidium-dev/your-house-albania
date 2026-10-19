// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { TRANSLATOR_DOM_GUARD_SCRIPT } from './translatorGuard'

/** A minimal Node with the two methods the guard wraps. */
function fakeDom() {
  class FakeNode {
    parentNode: FakeNode | null = null
    children: FakeNode[] = []
    removeChild(c: FakeNode) {
      const i = this.children.indexOf(c)
      if (i < 0) throw new Error('NotFoundError')
      this.children.splice(i, 1)
      c.parentNode = null
      return c
    }
    insertBefore(n: FakeNode, r: FakeNode | null) {
      const i = r ? this.children.indexOf(r) : this.children.length
      if (i < 0) throw new Error('NotFoundError')
      this.children.splice(i, 0, n)
      n.parentNode = this
      return n
    }
  }
  return FakeNode
}

describe('TRANSLATOR_DOM_GUARD_SCRIPT', () => {
  it('appends instead of throwing when the reference node has moved, and skips a stale removal', () => {
    const FakeNode = fakeDom()
    const win = { Node: FakeNode } as unknown as Window
    new Function('window', TRANSLATOR_DOM_GUARD_SCRIPT)(win)
    const parent = new FakeNode()
    const a = new FakeNode()
    parent.insertBefore(a, null)
    const moved = new FakeNode() // e.g. a text node a translator replaced
    const b = new FakeNode()
    expect(() => parent.insertBefore(b, moved)).not.toThrow()
    expect(parent.children).toEqual([a, b])
    expect(() => parent.removeChild(moved)).not.toThrow()
    parent.removeChild(a)
    expect(parent.children).toEqual([b])
  })

  it('wraps only once', () => {
    const FakeNode = fakeDom()
    const win = { Node: FakeNode } as unknown as Window
    new Function('window', TRANSLATOR_DOM_GUARD_SCRIPT)(win)
    const first = FakeNode.prototype.insertBefore
    new Function('window', TRANSLATOR_DOM_GUARD_SCRIPT)(win)
    expect(FakeNode.prototype.insertBefore).toBe(first)
  })
})
