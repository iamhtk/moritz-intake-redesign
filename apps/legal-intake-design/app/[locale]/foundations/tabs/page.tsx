import { FileText, Settings, Users } from '@repo/ui/icons';

import { Section } from '@/components/design/foundations/showcase/section';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import { ControlledTabsExample } from '@/components/design/foundations/examples/tabs-examples';

export default function TabsFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Tabs</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation tabs, built on the shadcn Tabs: an animated underline,
          horizontal and vertical orientation, icons, disabled triggers, and a
          mobile dropdown.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A TabsList of triggers paired with matching TabsContent panels."
      >
        <div className="w-full max-w-xl">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="cases">Cases</TabsTrigger>
            </TabsList>
            <TabsContent
              value="details"
              className="text-muted-foreground mt-4 text-sm"
            >
              Firm information and metadata.
            </TabsContent>
            <TabsContent
              value="members"
              className="text-muted-foreground mt-4 text-sm"
            >
              The people who belong to this firm.
            </TabsContent>
            <TabsContent
              value="cases"
              className="text-muted-foreground mt-4 text-sm"
            >
              Cases handled by this firm.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        title="Labels with counts"
        description="Append a count to a label to surface how many items each tab holds."
      >
        <div className="w-full max-w-xl">
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members (3)</TabsTrigger>
              <TabsTrigger value="cases">Cases (39)</TabsTrigger>
            </TabsList>
            <TabsContent
              value="details"
              className="text-muted-foreground mt-4 text-sm"
            >
              Firm information and metadata.
            </TabsContent>
            <TabsContent
              value="members"
              className="text-muted-foreground mt-4 text-sm"
            >
              3 members belong to this firm.
            </TabsContent>
            <TabsContent
              value="cases"
              className="text-muted-foreground mt-4 text-sm"
            >
              39 cases handled by this firm.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        title="With icons"
        description="Add an icon before the label — it sizes to 4 and stacks above the label on mobile, inline on sm+."
      >
        <div className="w-full max-w-xl">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">
                <FileText />
                Details
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users />
                Members
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings />
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="details"
              className="text-muted-foreground mt-4 text-sm"
            >
              Firm information and metadata.
            </TabsContent>
            <TabsContent
              value="members"
              className="text-muted-foreground mt-4 text-sm"
            >
              The people who belong to this firm.
            </TabsContent>
            <TabsContent
              value="settings"
              className="text-muted-foreground mt-4 text-sm"
            >
              Firm configuration.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        title="Disabled tab"
        description="Disable an individual trigger with the disabled prop; it dims and stops responding to interaction."
      >
        <div className="w-full max-w-xl">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="billing" disabled>
                Billing
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="details"
              className="text-muted-foreground mt-4 text-sm"
            >
              Firm information and metadata.
            </TabsContent>
            <TabsContent
              value="members"
              className="text-muted-foreground mt-4 text-sm"
            >
              The people who belong to this firm.
            </TabsContent>
            <TabsContent
              value="billing"
              className="text-muted-foreground mt-4 text-sm"
            >
              Billing is not available for this firm.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        title="Vertical orientation"
        description='Pass orientation="vertical" to Tabs; the list stacks beside the content and the accent moves to the inline-start edge.'
      >
        <div className="w-full max-w-xl">
          <Tabs
            defaultValue="details"
            orientation="vertical"
            className="w-full"
          >
            <TabsList className="min-w-36">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="cases">Cases</TabsTrigger>
            </TabsList>
            <TabsContent
              value="details"
              className="text-muted-foreground text-sm"
            >
              Firm information and metadata.
            </TabsContent>
            <TabsContent
              value="members"
              className="text-muted-foreground text-sm"
            >
              The people who belong to this firm.
            </TabsContent>
            <TabsContent
              value="cases"
              className="text-muted-foreground text-sm"
            >
              Cases handled by this firm.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        title="Responsive (mobile)"
        description="On small screens the tab strip is replaced by a Foundation Select, kept in sync with the tabs. Narrow the viewport below the sm breakpoint to preview it — the example below behaves the same as the others."
      >
        <div className="w-full max-w-xl">
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members (3)</TabsTrigger>
              <TabsTrigger value="cases">Cases (39)</TabsTrigger>
            </TabsList>
            <TabsContent
              value="details"
              className="text-muted-foreground mt-4 text-sm"
            >
              Firm information and metadata.
            </TabsContent>
            <TabsContent
              value="members"
              className="text-muted-foreground mt-4 text-sm"
            >
              The people who belong to this firm.
            </TabsContent>
            <TabsContent
              value="cases"
              className="text-muted-foreground mt-4 text-sm"
            >
              Cases handled by this firm.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section
        title="Controlled"
        description="Drive the active tab from React state with the value and onValueChange props."
      >
        <ControlledTabsExample />
      </Section>
    </>
  );
}
