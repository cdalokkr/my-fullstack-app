'use client';

import { useRouter } from 'next/navigation';
import { LogOut, MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { AsyncButton } from '@/components/ui/async-button';
import { trpc } from '@/lib/trpc/client';
import { Profile } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface UserProfilePopoverProps {
  user: Profile | null;
}

export function UserProfilePopover({ user }: UserProfilePopoverProps) {
  const { state } = useSidebar();
  const router = useRouter();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleSignOut = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Redirect to login page after successful logout
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Error is handled by AsyncButton
    }
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("flex items-center gap-2 rounded-md text-left", isCollapsed ? "justify-center p-0" : "w-full p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
          <div className={cn("rounded-full p-1", isCollapsed && "hover:bg-sidebar-accent hover:scale-110 transition-transform")}>
            <UserAvatarProfile user={user} showInfo={!isCollapsed} className="h-8 w-8" />
          </div>
          <MoreHorizontal className={cn("ml-auto h-4 w-4", isCollapsed && "hidden")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="top">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatarProfile user={user} showInfo={true} className="h-10 w-10" />
          </div>
          <div className="border-t pt-4">
            <AsyncButton
              onClick={handleSignOut}
              loadingText="Signing out..."
              successText="Signed out successfully!"
              errorText="Failed to sign out"
              variant="outline"
              className="w-full justify-start"
              loadingPhases={[
                { text: "Signing out...", duration: 1000 },
              ]}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </AsyncButton>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}