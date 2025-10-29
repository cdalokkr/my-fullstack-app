'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { LogoutModal } from '@/components/ui/logout-modal';

interface UserProfilePopoverProps {
  user: Profile | null;
}

export function UserProfilePopover({ user }: UserProfilePopoverProps) {
  const { state } = useSidebar();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isCollapsed = state === 'collapsed';

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn("flex items-center gap-2 rounded-md text-left", isCollapsed ? "justify-center p-0" : "w-full p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
            <div className={cn("rounded-full p-1", isCollapsed && "hover:bg-sidebar-accent hover:scale-110 transition-transform")}>
              <UserAvatarProfile user={user} showInfo={!isCollapsed} className="h-8 w-8" />
            </div>
            <LogOut className={cn("ml-auto h-4 w-4", isCollapsed && "hidden")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end" side="top">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatarProfile user={user} showInfo={true} className="h-10 w-10" />
            </div>
            <div className="border-t pt-4">
              <Button
                onClick={() => setIsLogoutModalOpen(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
      />
    </>
  );
}