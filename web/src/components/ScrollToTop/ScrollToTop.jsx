import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Every navigation starts at the top of the new page: not where the last page was scrolled to, and not
// where the browser would restore on Back. The jump is instant (the site has smooth scrolling on, which
// would otherwise make the new page glide up from the old position), and it happens before the page paints.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export default function ScrollToTop() {
  const { key } = useLocation();   // a new key for every navigation, even a link back to the same page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [key]);
  return null;
}
