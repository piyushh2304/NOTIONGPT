"use client";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface IconPickerProps {
  onChange: (icon: string) => void;
  children: React.ReactNode;
  asChild?: boolean;
}

export const IconPicker = ({
  onChange,
  children,
  asChild
}: IconPickerProps) => {
//   const { resolvedTheme } = useTheme();
// Simple theme detection or default to light/dark based on system for now if no useTheme
// Assuming light for MVP or defaulting to auto if supported
  const currentTheme = (typeof window !== "undefined" && window.document.documentElement.classList.contains("dark")) 
    ? Theme.DARK 
    : Theme.LIGHT;

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full border-none shadow-none">
        <EmojiPicker
          height={350}
          theme={currentTheme}
          onEmojiClick={(data) => onChange(data.emoji)}
        />
      </PopoverContent>
    </Popover>
  );
};
