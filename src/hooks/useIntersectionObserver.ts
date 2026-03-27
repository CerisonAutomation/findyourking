"use client";

import {RefObject, useEffect, useRef, useState} from "react";

interface UseIntersectionObserverOptions {
    threshold?: number | number[];
    root?: Element | null;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
}

/**
 * Custom hook for detecting when an element enters the viewport.
 * Useful for lazy loading images and infinite scroll.
 *
 * @param options - IntersectionObserver options
 * @returns A tuple of [ref, isIntersecting, entry]
 *
 * @example
 * ```tsx
 * const [ref, isVisible] = useIntersectionObserver({
 *   threshold: 0.1,
 *   freezeOnceVisible: true,
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isVisible ? <ExpensiveComponent /> : <Placeholder />}
 *   </div>
 * );
 * ```
 */
export function useIntersectionObserver<T extends Element>(
    options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean, IntersectionObserverEntry | null] {
    const {threshold = 0, root = null, rootMargin = "0px", freezeOnceVisible = false} = options;

    const elementRef = useRef<T | null>(null);
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

    const isIntersecting = entry?.isIntersecting ?? false;
    const frozen = freezeOnceVisible && isIntersecting;

    useEffect(() => {
        const node = elementRef.current;
        const hasIOSupport = !!window.IntersectionObserver;

        if (!hasIOSupport || frozen || !node) return;

        const observerParams = {threshold, root, rootMargin};
        const observer = new IntersectionObserver(([entry]) => {
            setEntry(entry ?? null);
        }, observerParams);

        observer.observe(node);

        return () => observer.disconnect();
    }, [threshold, root, rootMargin, frozen]);

    return [elementRef, isIntersecting, entry];
}