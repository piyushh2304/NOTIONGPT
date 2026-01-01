
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@tiptap/react';
import { Command } from 'lucide-react';

interface SlashCommandListProps {
  items: any[];
  command: any;
  editor: Editor;
}

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback((index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  }, [props]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 text-black shadow-xl animate-in fade-in zoom-in duration-200 dark:border-stone-700 dark:bg-[#2F2F2F] dark:text-stone-100 mb-8 scrollbar-hide">
      <div className="flex flex-col gap-1">
        {props.items.length === 0 ? (
           <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                No results
           </div>
        ) : (
          props.items.map((item, index) => {
            const isStartOfSection = index === 0 || item.section !== props.items[index - 1].section;
            return (
              <React.Fragment key={index}>
                {isStartOfSection && (
                   <div className="px-2 py-1.5 text-[11px] font-semibold text-stone-500 select-none">
                       {item.section}
                   </div>
                )}
                <button
                className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    index === selectedIndex ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" : "bg-transparent"
                }`}
                onClick={() => selectItem(index)}
                >
                <div className="flex items-center gap-2">
                     <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-stone-200 bg-white dark:border-stone-700 dark:bg-neutral-800">
                          {item.icon || <Command className="h-3 w-3" />}
                     </div>
                     <span className="truncate">{item.title}</span>
                </div>
                {item.shortcut && (
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono tracking-tighter">
                        {item.shortcut}
                    </span>
                )}
                </button>
              </React.Fragment>
            )
          })
        )}
      </div>
      <div className="sticky bottom-[-8px] -mx-1 -mb-2 bg-white pt-2 pb-2 px-3 border-t border-stone-100 mt-2 dark:bg-[#2F2F2F] dark:border-stone-800">
            <div className="flex justify-between items-center text-[10px] text-stone-400 dark:text-stone-500">
                <span>Type '/' on the page</span>
                <span>esc</span>
            </div>
      </div>
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
