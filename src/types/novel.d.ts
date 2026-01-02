
declare module "novel" {
    import { FC, ReactNode } from "react";
    import { Editor } from "@tiptap/core";

    export const EditorRoot: FC<{
        children: ReactNode;
        extensions?: any[];
        className?: string;
    }>;
    export const EditorContent: FC<{
        className?: string;
        initialContent?: any;
        onChange?: (value: string) => void;
        extensions?: any[];
        editorProps?: any;
        children?: ReactNode; // Allow children for slots
        onUpdate?: (props: { editor: Editor }) => void; // Add legacy support if needed
    }>;

    export const EditorBubble: FC<{
        children: ReactNode;
        className?: string;
        tippyOptions?: any;
    }>;

    export const EditorBubbleItem: FC<{
        children: ReactNode;
        onSelect?: (editor: Editor) => void;
        className?: string;
    }>;

    export const EditorCommand: FC<{
        className?: string;
        children: ReactNode;
    }>;

    export const EditorCommandItem: FC<{
        onCommand: (item: any) => void;
        children: ReactNode;
        className?: string;
        key?: string;
    }>;

    export const EditorCommandList: FC<{
        children: ReactNode;
    }>;

    export const EditorCommandEmpty: FC<{
        className?: string;
        children: ReactNode;
    }>;

    export const Command: {
        configure: (options: any) => any;
    };

    export const createSuggestionItems: (items: any[]) => any[];
    export const renderItems: any;
    export const handleCommandNavigation: any;
}
