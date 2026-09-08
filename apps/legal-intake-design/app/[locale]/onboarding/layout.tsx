import { Link } from '@/i18n/navigation';
import { Button } from '@/components/design/design-system/button';
import { OnboardingPanelProvider } from '@/components/design/onboarding/onboarding-panel-context';
import { OnboardingBrandPanel } from '@/components/design/onboarding/onboarding-brand-panel';
import { OnboardingPreviewToggle } from '@/components/design/onboarding/onboarding-preview-toggle';
import { OnboardingHeaderLogo } from '@/components/design/onboarding/onboarding-header-logo';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <OnboardingPanelProvider>
      <div className="bg-background text-foreground grid min-h-svh lg:grid-cols-2">
        {/* Left: form column */}
        <div className="flex flex-col gap-6 p-6 md:p-10 lg:h-svh lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <OnboardingHeaderLogo />
            <div className="flex items-center gap-1">
              <OnboardingPreviewToggle />
              <Button variant="ghost" asChild>
                <Link href="/">Sign out</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-2xl py-4 lg:py-8">{children}</div>
          </div>
        </div>

        {/* Right: branded gradient panel (hidden below lg) */}
        <OnboardingBrandPanel />
      </div>
    </OnboardingPanelProvider>
  );
}
