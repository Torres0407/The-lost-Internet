const BLOCKED_ELEMENTS = new Set([
  'SCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'APPLET',
  'BASE',
  'NOSCRIPT',
]);

const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'poster']);

function isUnsafeUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  return (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html')
  );
}

export function buildSanitizedShadowNodes(
  rawHtml: string,
  targetDoc: Document
): Node[] {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(rawHtml, 'text/html');

  const sanitizeTree = (root: Element) => {
    const toRemove: Element[] = [];
    const walker = parsed.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let current = walker.nextNode();
    while (current) {
      if (current instanceof Element) {
        const tag = current.tagName.toUpperCase();
        if (
          BLOCKED_ELEMENTS.has(tag) ||
          (tag === 'META' &&
            current.getAttribute('http-equiv')?.toLowerCase() === 'refresh')
        ) {
          toRemove.push(current);
        } else {
          const attrs = Array.from(current.attributes);
          for (const attr of attrs) {
            const nameLower = attr.name.toLowerCase();
            if (nameLower.startsWith('on')) {
              current.removeAttribute(attr.name);
            } else if (URL_ATTRIBUTES.has(nameLower) && isUnsafeUrl(attr.value)) {
              current.removeAttribute(attr.name);
            }
          }
        }
      }
      current = walker.nextNode();
    }
    for (const el of toRemove) {
      el.remove();
    }
  };

  sanitizeTree(parsed.documentElement);

  const nodes: Node[] = [];
  const styles = parsed.head.querySelectorAll('style');
  for (const styleEl of styles) {
    nodes.push(targetDoc.importNode(styleEl, true));
  }

  const wrapper = targetDoc.createElement('div');
  wrapper.className = parsed.body.className || 'page-body';
  wrapper.style.minHeight = '100%';
  for (const child of Array.from(parsed.body.childNodes)) {
    wrapper.appendChild(targetDoc.importNode(child, true));
  }
  nodes.push(wrapper);

  return nodes;
}
