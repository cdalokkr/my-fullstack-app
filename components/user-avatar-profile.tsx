'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Profile } from '@/types';

interface UserAvatarProfileProps {
  user: Profile | null;
  showInfo?: boolean;
  className?: string;
}

export function UserAvatarProfile({ user, showInfo = false, className }: UserAvatarProfileProps) {
  if (!user) {
    return (
      <div className={cn('flex items-center gap-2', showInfo ? '' : 'justify-center')}>
        <Avatar className={className}>
          <AvatarFallback className="bg-blue-500 text-white">U</AvatarFallback>
        </Avatar>
        {showInfo && (
          <div className="flex flex-col">
            <span className="text-sm font-medium">Loading...</span>
            <span className="text-xs text-muted-foreground">user@example.com</span>
          </div>
        )}
      </div>
    );
  }

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className={cn('flex items-center gap-2', showInfo ? '' : 'justify-center')}>
      <Avatar className={className}>
        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
        <AvatarFallback className="bg-blue-500 text-white">{initials}</AvatarFallback>
      </Avatar>
      {showInfo && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.full_name || 'User'}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      )}
    </div>
  );
}