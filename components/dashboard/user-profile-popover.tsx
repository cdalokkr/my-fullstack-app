'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { LogoutModal } from '@/components/ui/logout-modal';

interface UserProfilePopoverProps {
  user: Profile | null;
}

export function UserProfilePopover({ user }: UserProfilePopoverProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-sidebar-accent">
            <UserAvatarProfile user={user} showInfo={false} className="h-8 w-8" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end" side="bottom">
          <div className="space-y-4">
            <UserAvatarProfile user={user} showInfo={true} className="h-10 w-10" />
            <div className="border-t pt-4">
              <Button
                data-logout-trigger
                onClick={() => setIsLogoutModalOpen(true)}
                variant="outline"
                className="w-full justify-start hover:bg-sidebar-accent"
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