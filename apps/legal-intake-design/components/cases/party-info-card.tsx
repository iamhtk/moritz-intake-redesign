import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Muted } from '@/components/design/design-system/typography';

interface PartyInfoCardProps {
  title: string;
  name: string;
  subName: string;
  detail?: string;
  initials: string;
  colorClass?: string;
}

export function PartyInfoCard({
  title,
  name,
  subName,
  detail,
  initials,
  colorClass = 'bg-primary',
}: PartyInfoCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={`${colorClass} text-white`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium leading-none">{name}</p>
          <Muted>{subName}</Muted>
          {detail && <p className="text-muted-foreground text-xs">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
