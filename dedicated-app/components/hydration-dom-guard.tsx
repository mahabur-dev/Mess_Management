const hydrationDomGuardSource = String.raw`
(() => {
  const removeDocumentFormattingNodes = () => {
    for (const parent of [document.head, document.body]) {
      if (!parent) continue;

      for (const node of Array.from(parent.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
          node.remove();
        }
      }
    }
  };

  removeDocumentFormattingNodes();

  const observer = new MutationObserver(removeDocumentFormattingNodes);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const finish = () => {
    removeDocumentFormattingNodes();
    requestAnimationFrame(() => {
      removeDocumentFormattingNodes();
      observer.disconnect();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finish, { once: true });
  } else {
    finish();
  }
})();
`

/**
 * Some browser device simulators format the document before React hydrates it,
 * inserting whitespace-only nodes beside Next.js metadata boundaries. React
 * treats those nodes as structural mismatches. This blocking script removes
 * only document-level formatting nodes; application content is never touched.
 */
export function HydrationDomGuard() {
  return <script id="hydration-dom-guard" dangerouslySetInnerHTML={{ __html: hydrationDomGuardSource }} />
}
