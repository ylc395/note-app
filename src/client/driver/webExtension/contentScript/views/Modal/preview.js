/* eslint-env browser */
window.addEventListener('message', (e) => {
  if (e.data.message === 'render') {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(e.data.html, 'text/html');

    document.documentElement.replaceWith(doc.documentElement);
  }
});

parent.postMessage({ message: 'ready' }, '*');
