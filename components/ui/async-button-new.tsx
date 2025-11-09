"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, XCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AsyncButtonProps {
  onClick: () => Promise<void>;
  initialText?: string;
  successText?: string;
  errorText?: string;
  loadingText?: string;
  className?: string;
}

export default function AsyncButton({
  onClick,
  initialText = "Create User",
  successText = "Success!!",
  errorText = "Error Occurred",
  loadingText = "Loading..",
  className,
}: AsyncButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [width, setWidth] = useState<number | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 🧮 Dynamically calculate the widest label to prevent flicker
  useLayoutEffect(() => {
    if (!buttonRef.current) return;
    const texts = [initialText, loadingText, successText, errorText];
    const temp = document.createElement("span");
    temp.style.visibility = "hidden";
    temp.style.position = "absolute";
    temp.style.whiteSpace = "nowrap";
    temp.className = buttonRef.current.className;
    document.body.appendChild(temp);

    let maxWidth = 0;
    for (const text of texts) {
      temp.textContent = text;
      maxWidth = Math.max(maxWidth, temp.offsetWidth);
    }

    document.body.removeChild(temp);
    setWidth(maxWidth + 48); // padding buffer
  }, [initialText, loadingText, successText, errorText]);

  // 🧠 Button logic
  const handleClick = async () => {
    if (state !== "idle") return;
    setState("loading");

    try {
      await onClick();
      setState("success");
      // Success state persists - no auto-reset to allow for redirection
      // Users can click again once the state naturally clears (e.g., after redirection)
      // setTimeout(() => setState("idle"), 1500); // Commented out to prevent reset on success
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 1500);
    }
  };

  // 🎨 Dynamic color classes (light/dark mode friendly)
  const colorMap: Record<typeof state, string> = {
    idle: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    loading: "bg-blue-500 dark:bg-blue-400 cursor-wait",
    success: "bg-green-600 dark:bg-green-500",
    error: "bg-red-600 dark:bg-red-500",
  };

  const renderIcon = () => {
    switch (state) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "success":
        return <Check className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const renderText = () => {
    switch (state) {
      case "loading":
        return loadingText;
      case "success":
        return successText;
      case "error":
        return errorText;
      default:
        return initialText;
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={state !== "idle"}
      animate={{
        scale: state === "success" ? 1.05 : state === "error" ? 0.95 : 1,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white dark:text-gray-100 transition-all duration-300 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed",
        colorMap[state],
        className
      )}
      style={{ width }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {renderIcon()}
          <span>{renderText()}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
