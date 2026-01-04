
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Check, Copy, Globe, Lock, Mail, User } from "lucide-react"
import { useDocuments } from "@/hooks/use-documents"
import { Switch } from "@/components/ui/switch"

interface SharePopoverProps {
  documentId: string;
  isPublic: boolean;
  allowedUsers?: string[];
  trigger: React.ReactNode;
}

export function SharePopover({ documentId, isPublic: initialIsPublic, allowedUsers: initialAllowedUsers, trigger }: SharePopoverProps) {
  const { updateDocument } = useDocuments();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [allowedUsers, setAllowedUsers] = useState<string[]>(initialAllowedUsers || []);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync state when props change (optional, depending on parent re-render strategy)
  // For now, assume parent manages re-fetching or optimistic UI updates
  
  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) return;
    
    const newAllowedUsers = [...allowedUsers, inviteEmail];
    setAllowedUsers(newAllowedUsers); // Optimistic
    setInviteEmail("");

    await updateDocument(documentId, { allowedUsers: newAllowedUsers });
  };

  const handleTogglePublic = async (checked: boolean) => {
    setIsPublic(checked); // Optimistic
    await updateDocument(documentId, { isPublic: checked });
  };

  const handleCopyLink = () => {
    const url = window.location.href; // Assumes current page is the doc
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <Tabs defaultValue="share" className="w-full">
          <div className="flex items-center px-4 py-3 border-b border-border/50">
             <TabsList className="bg-transparent p-0 h-auto gap-4">
                <TabsTrigger value="share" className="px-0 py-1 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium text-xs">Share</TabsTrigger>
                <TabsTrigger value="publish" className="px-0 py-1 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium text-xs">Publish</TabsTrigger>
             </TabsList>
          </div>

          <TabsContent value="share" className="p-4 pt-4 mt-0 space-y-4">
             {/* Invite Section */}
             <div className="flex gap-2">
                <Input 
                   placeholder="Email or group, separated by commas" 
                   value={inviteEmail}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                   className="h-9 text-xs"
                />
                <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4" onClick={handleInvite}>
                    Invite
                </Button>
             </div>

             {/* Users List */}
             <div className="space-y-4 pt-2">
                {/* Me */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                             <User size={14} />
                        </div>
                        <div className="flex flex-col">
                             <span className="text-sm font-medium">Me (You)</span>
                             <span className="text-xs text-muted-foreground">Owner</span>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Full access</span>
                </div>

                {/* Invited Users */}
                {allowedUsers.map((email) => (
                    <div key={email} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                 {email[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                 <span className="text-sm font-medium">{email}</span>
                                 <span className="text-xs text-muted-foreground">{email}</span>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">Can view</span>
                    </div>
                ))}
             </div>

             <Separator />

             {/* General Access */}
             <div className="space-y-3">
                 <h4 className="text-xs font-semibold text-muted-foreground">General access</h4>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPublic ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                              {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                         </div>
                         <div className="flex flex-col">
                             <span className="text-sm font-medium capitalize">
                                 {isPublic ? 'Anyone with the link' : 'Restricted'}
                             </span>
                             <span className="text-xs text-muted-foreground">
                                 {isPublic ? 'Anyone on the internet with the link can view' : 'Only people invited can access'}
                             </span>
                         </div>
                     </div>
                      
                      {/* Using Switch for simple toggle, effectively mimics dropdown behavior for binary choice */}
                     <Switch 
                        checked={isPublic}
                        onCheckedChange={handleTogglePublic}
                     />
                 </div>
             </div>
             
             <Separator />

             <div className="flex items-center justify-between pt-1">
                 <a href="#" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center font-serif text-[8px]">?</div>
                    Learn about sharing
                 </a>
                 <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={handleCopyLink}>
                     {copied ? <Check size={14} /> : <Copy size={14} />}
                     {copied ? "Copied" : "Copy link"}
                 </Button>
             </div>

          </TabsContent>
          
          <TabsContent value="publish" className="p-4 pt-1 mt-0">
              <div className="text-center py-8 text-sm text-muted-foreground">
                  Publish to web coming soon.
              </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
