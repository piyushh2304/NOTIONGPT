import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Editor } from "@tiptap/react";

interface CommandListProps {
  items: any[];
  command: any;
  editor: any;
}

export const CommandList = forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = props.items[index];

      if (item) {
        props.command(item);
      }
    },
    [props]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 h-auto max-h-[330px] w-[300px] overflow-hidden rounded-lg border border-zinc-700 bg-[#1F1F1F] shadow-2xl transition-all font-medium text-zinc-100">
      <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-700/50">
         Notion AI
      </div>
      <div className="overflow-y-auto max-h-[280px] p-1">
          {props.items.map((item, index) => (
            <button
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                index === selectedIndex ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
              key={index}
              onClick={() => selectItem(index)}
            >
              <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${
                   item.title === "Ask AI" ? "text-purple-500" : 
                   item.title.includes("Text") ? "text-zinc-400" : 
                   item.title.includes("Heading") ? "text-zinc-400" : "text-zinc-400"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-xs">{item.title}</p>
                <p className="text-[10px] text-zinc-500 truncate">{item.description}</p>
              </div>
            </button>
          ))}
      </div>
      <div className="px-3 py-2 border-t border-zinc-700 text-[10px] text-zinc-500 flex justify-between bg-[#1F1F1F]">
            <span>Type '/' to filter</span>
            <span>esc</span>
       </div>
    </div>
  );
});

CommandList.displayName = "CommandList";
