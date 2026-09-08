import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';

type Props = {
  rightContent?: React.ReactNode;
};

export function Header({ rightContent }: Props) {
  return (
    <div className="border-b px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>

        {rightContent && <div>{rightContent}</div>}
      </div>
    </div>
  );
}
