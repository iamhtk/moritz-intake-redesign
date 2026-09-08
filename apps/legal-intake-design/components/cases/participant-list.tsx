import { MessageAvatar } from '@/components/messages/message-avatar';
import type { ParticipantRef } from '@/lib/types';

export function ParticipantList({
  participants,
}: {
  participants: ParticipantRef[];
}) {
  return (
    <div className="space-y-1">
      <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        Participants
      </h4>
      <ul className="space-y-1">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <MessageAvatar participant={p} className="h-6 w-6" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{p.name}</div>
              {p.companyName && (
                <div className="text-muted-foreground truncate text-xs">
                  {p.companyName}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
