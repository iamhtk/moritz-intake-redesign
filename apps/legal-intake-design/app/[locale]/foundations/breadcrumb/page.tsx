import type { Metadata } from 'next';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/design/foundations/components/breadcrumb';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Breadcrumb · Foundations' };

export default function BreadcrumbFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Breadcrumb</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A hierarchical navigation trail that shows the user&apos;s location
          and lets them step back up the hierarchy. Composed from small parts —
          links, a current page, and separators — with an optional ellipsis to
          collapse long trails. Used in the app chrome, for example the
          case-detail top nav.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A link back up the hierarchy, a chevron separator, and the current page."
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cases</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Case detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      <Section
        title="In context (top nav)"
        description="The trail rendered on a case-detail page: a link to Cases and the current case title, truncated when space is tight."
      >
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap gap-2 text-sm sm:gap-2">
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground" href="#">
                Cases
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/50">
              /
            </BreadcrumbSeparator>
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-medium">
                NDA review: manufacturing partner
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      <Section
        title="Custom separator"
        description="Pass any node as a separator's children — here a slash instead of the default chevron."
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cases</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Case detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      <Section
        title="Collapsed"
        description="Use BreadcrumbEllipsis to collapse intermediate levels on a long trail."
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cases</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Case detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>
    </>
  );
}
