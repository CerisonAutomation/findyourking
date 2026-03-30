import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions extends IntersectionObserverInit {
  /** Fire once, then unobserve. Default: false */
  triggerOnce?: boolean;
}

interface UseInViewResult {
  /** Attach this ref to the sentinel / target element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** True when the element intersects the viewport */
  inView: boolean;
}

/**
 * Lightweight, dependency-free replacement for react-intersection-observer.
 * Uses the native IntersectionObserver API.
 *
 * @example
 * const { ref, inView } = useInView({ threshold: 0 });
 * <div ref={ref} />
 */
export function useInView({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  triggerOnce = false,
}: UseInViewOptions = {}): UseInViewResult {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);
        if (isIntersecting && triggerOnce) {
          observer.unobserve(el);
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, triggerOnce]);

  return { ref, inView };
}
