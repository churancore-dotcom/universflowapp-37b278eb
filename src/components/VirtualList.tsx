import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, type Key, type ReactNode, type RefObject } from 'react';

interface VirtualListProps<T> {
  items: T[];
  /** Best-guess pixel height of a single row. Doesn't need to be exact. */
  estimateSize: number;
  /** The scroll container that wraps this list. Required. */
  scrollParentRef: RefObject<HTMLElement>;
  overscan?: number;
  /** Vertical gap between rows in pixels. Folded into row height. */
  gap?: number;
  /** Render only when items.length >= this. Below it, fall back to plain map. */
  threshold?: number;
  renderItem: (item: T, index: number) => ReactNode;
  getKey?: (item: T, index: number) => Key;
  className?: string;
}

/**
 * Lightweight virtualized list built on @tanstack/react-virtual. Reuses an
 * existing scroll container — no nested scrollers, no layout fights. Below
 * `threshold` it renders inline so short lists keep their natural flow,
 * animations, and accessibility.
 */
export function VirtualList<T>({
  items,
  estimateSize,
  scrollParentRef,
  overscan = 6,
  gap = 0,
  threshold = 40,
  renderItem,
  getKey,
  className,
}: VirtualListProps<T>) {
  const rowSize = estimateSize + gap;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => rowSize,
    overscan,
  });

  const useVirtual = items.length >= threshold;

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const keyFor = useMemo(
    () => getKey ?? ((_: T, i: number) => i),
    [getKey],
  );

  if (!useVirtual) {
    return (
      <div className={className} style={gap ? { display: 'flex', flexDirection: 'column', gap } : undefined}>
        {items.map((item, i) => (
          <div key={keyFor(item, i)}>{renderItem(item, i)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', height: totalSize }}>
      {virtualItems.map((v) => {
        const item = items[v.index];
        return (
          <div
            key={keyFor(item, v.index)}
            data-index={v.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${v.start}px)`,
              paddingBottom: gap || undefined,
            }}
          >
            {renderItem(item, v.index)}
          </div>
        );
      })}
    </div>
  );
}

export default VirtualList;
