import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function ResponsiveVerifyTag({ verified }) {
  const ref = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const height = el.scrollHeight;
      setCompact(height > fontSize * 1.8);
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className={`flex items-center justify-center gap-1 ${
        verified ? "text-success" : "text-error"
      } whitespace-nowrap`}
    >
      <FontAwesomeIcon
        icon={verified ? faCircleCheck : faCircleXmark}
        className="text-base"
      />
      {!compact && <span>{verified ? "已驗證" : "未驗證"}</span>}
    </span>
  );
}
