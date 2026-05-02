import { useEffect, useState } from 'react';

function parse() {
  const h = (location.hash || '#/upload').replace(/^#/, '');
  const parts = h.split('/').filter(Boolean);
  return { name: parts[0] || 'upload', param: parts[1] || null, raw: h };
}

export function useRoute() {
  const [route, setRoute] = useState(parse());
  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export function navigate(path) {
  location.hash = path.startsWith('#') ? path : '#' + path;
}
