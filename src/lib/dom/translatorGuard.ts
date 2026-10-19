/**
 * Browser translators (Chrome's Google Translate, Edge, Yandex) and some
 * extensions swap the text nodes React rendered for `<font>` wrappers. When
 * React later inserts a sibling before such a node, or removes it, the DOM
 * call throws ("Failed to execute 'insertBefore' on 'Node': The node before
 * which the new node is to be inserted is not a child of this node") and the
 * whole subtree stops updating. Clarity counted these as 33 % of the JS errors
 * on listing and catalogue pages (audit 2026-10-18); reproduced with a
 * translated catalogue and "Show more" (docs/ux/cls-2026-10.md).
 *
 * The guard React's maintainers suggest (facebook/react#11538): when the node
 * React means has already left the parent, insert at the end / skip the
 * removal instead of throwing. Every other call goes to the original method.
 * Runs once, before hydration; the flag keeps a second copy from wrapping the
 * first.
 */
export const TRANSLATOR_DOM_GUARD_SCRIPT = `(function(){var N=window.Node;if(!N||!N.prototype||N.prototype.__dlGuard)return;var p=N.prototype;p.__dlGuard=true;var rc=p.removeChild,ib=p.insertBefore;p.removeChild=function(c){if(c&&c.parentNode!==this)return c;return rc.apply(this,arguments)};p.insertBefore=function(n,r){if(r&&r.parentNode!==this)return ib.call(this,n,null);return ib.apply(this,arguments)}})();`
