import { MutableRefObject, useCallback, useEffect } from "react";

export const useHorizontalScroll = <T extends HTMLElement | null>(
  containerRef: MutableRefObject<T>,
  flag: boolean
) => {
  const handleHorizontalScroll = useCallback(
    (event: WheelEvent) => {
      if (containerRef.current) {
        event.preventDefault(); // 阻止默认的垂直滚动
        containerRef.current.scrollLeft += event.deltaY; // 使用 deltaY 来控制横向滚动
      }
    },
    [flag]
  );

  useEffect(() => {
    const container = containerRef.current;

    if (container && !flag)
      container.addEventListener("wheel", handleHorizontalScroll);

    return () =>
      container &&
      container.removeEventListener("wheel", handleHorizontalScroll);
  }, [flag]);
};
