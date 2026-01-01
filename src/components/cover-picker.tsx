"use client";

import { ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CoverPickerProps {
    onChange: (url: string) => void;
    children?: React.ReactNode;
    asChild?: boolean;
}

const COVERS = [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1519681393798-38e43269d877?ixlib=rb-4.0.3&auto=format&fit=crop&w=1738&q=80",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1444464666117-26f9d9472660?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1418985991508-e47386d96a71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
];

export const CoverPicker = ({ onChange, children, asChild }: CoverPickerProps) => {
    return (
        <Dialog>
             <DialogTrigger asChild={asChild}>
                {children}
             </DialogTrigger>
             <DialogContent className="max-w-2xl h-[50vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Choose a cover</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {COVERS.map((url, i) => (
                        <div 
                            key={i} 
                            onClick={() => onChange(url)}
                            className="aspect-video relative rounded-md overflow-hidden cursor-pointer hover:opacity-75"
                        >
                            <img src={url} alt="Cover option" className="object-cover w-full h-full" />
                        </div>
                    ))}
                </div>
             </DialogContent>
        </Dialog>
    );
};
