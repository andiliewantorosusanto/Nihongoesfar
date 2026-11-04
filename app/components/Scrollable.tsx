import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function Scrollable({
  children,
  className,
  label,
}: Readonly<{
  children: ReactNode;
  className: string;
  label: string;
}>) {
  const ref = useRef<HTMLElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setOverflowing(element.scrollWidth > element.clientWidth);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    update();
    return () => observer.disconnect();
  }, [children]);
  function scroll(direction: number) {
    const element = ref.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.8 });
  }
  return (
    <div className="scroll-container">
      {overflowing && (
        <div className="scroll-controls">
          <button
            type="button"
            className="secondary"
            aria-label={`Scroll ${label} left`}
            onClick={() => scroll(-1)}
          >
            ← Scroll left
          </button>
          <button
            type="button"
            className="secondary"
            aria-label={`Scroll ${label} right`}
            onClick={() => scroll(1)}
          >
            Scroll right →
          </button>
        </div>
      )}
      <section ref={ref} className={className} aria-label={label}>
        {children}
      </section>
    </div>
  );
}
