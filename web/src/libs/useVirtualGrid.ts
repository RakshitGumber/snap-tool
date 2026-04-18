import { useMemo } from "react";

type VirtualGridItem = {
  index: number;
  column: number;
  row: number;
};

export const useVirtualGrid = ({
  itemCount,
  containerHeight,
  scrollTop,
  columnCount,
  rowHeight,
  overscanRows = 2,
}: {
  itemCount: number;
  containerHeight: number;
  scrollTop: number;
  columnCount: number;
  rowHeight: number;
  overscanRows?: number;
}) =>
  useMemo(() => {
    const safeColumnCount = Math.max(columnCount, 1);
    const rowCount = Math.ceil(itemCount / safeColumnCount);
    const totalHeight = rowCount * rowHeight;

    const startRow = Math.max(Math.floor(scrollTop / rowHeight) - overscanRows, 0);
    const endRow = Math.min(
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscanRows,
      rowCount,
    );

    const items: VirtualGridItem[] = [];
    for (let row = startRow; row < endRow; row += 1) {
      for (let column = 0; column < safeColumnCount; column += 1) {
        const index = row * safeColumnCount + column;
        if (index >= itemCount) {
          break;
        }

        items.push({
          index,
          column,
          row,
        });
      }
    }

    return {
      items,
      rowCount,
      totalHeight,
      startRow,
    };
  }, [columnCount, containerHeight, itemCount, overscanRows, rowHeight, scrollTop]);
