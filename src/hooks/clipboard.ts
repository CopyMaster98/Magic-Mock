import { useEffect, useRef } from "react";

export const useGetClipboardValue = (isCancel = false) => {
  const timer = useRef<any>();

  useEffect(() => {
    if (isCancel) {
      if (timer.current) clearTimeout(timer.current);
      return;
    }

    timer.current = setInterval(async () => {
      let data;
      try {
        data = await navigator.clipboard.readText();

        const fetchRegex = /fetch\(\s*['"]([^'"]+)['"]\s*,\s*({[\s\S]*?})\s*\)/;

        if (
          !sessionStorage.getItem("isFetch") ||
          sessionStorage.getItem("isFetch") !==
            (+!!data.match(fetchRegex)).toString()
        )
          sessionStorage.setItem(
            "isFetch",
            (+!!data.match(fetchRegex)).toString()
          );
      } catch (error) {
        // sessionStorage.setItem("isFetch", "0");
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [isCancel]);
};
