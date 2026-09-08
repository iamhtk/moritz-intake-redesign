import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { Subheading } from '@/components/design/foundations/components/heading';
import { Section } from '@/components/design/foundations/showcase/section';

export default function DescriptionListFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Description List</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation description list, built on native <code>dl</code>/
          <code>dt</code>/<code>dd</code>: label/value rows, record summaries,
          an optional heading, hairline row separators, and a responsive
          two-column layout.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Pairs of DescriptionTerm and DescriptionDetails render as label/value rows."
      >
        <div className="w-full max-w-2xl">
          <DescriptionList>
            <DescriptionTerm>Customer</DescriptionTerm>
            <DescriptionDetails>Leslie Alexander</DescriptionDetails>

            <DescriptionTerm>Email</DescriptionTerm>
            <DescriptionDetails>
              leslie.alexander@example.com
            </DescriptionDetails>

            <DescriptionTerm>Access</DescriptionTerm>
            <DescriptionDetails>Admin</DescriptionDetails>
          </DescriptionList>
        </div>
      </Section>

      <Section
        title="Order summary"
        description="A longer list summarising the fields of a single record, with amounts aligned in the details column."
      >
        <div className="w-full max-w-2xl">
          <DescriptionList>
            <DescriptionTerm>Customer</DescriptionTerm>
            <DescriptionDetails>Michael Foster</DescriptionDetails>

            <DescriptionTerm>Event</DescriptionTerm>
            <DescriptionDetails>Bear Hug: Live in Concert</DescriptionDetails>

            <DescriptionTerm>Amount</DescriptionTerm>
            <DescriptionDetails>$150.00 USD</DescriptionDetails>

            <DescriptionTerm>Amount after exchange rate</DescriptionTerm>
            <DescriptionDetails>US$150.00 &rarr; CA$199.79</DescriptionDetails>

            <DescriptionTerm>Fee</DescriptionTerm>
            <DescriptionDetails>$4.79 USD</DescriptionDetails>

            <DescriptionTerm>Net</DescriptionTerm>
            <DescriptionDetails>$1,955.00</DescriptionDetails>
          </DescriptionList>
        </div>
      </Section>

      <Section
        title="With a heading"
        description="Pair the list with a Subheading to title the record it summarises."
      >
        <div className="w-full max-w-2xl">
          <Subheading variant="sans" level={3}>
            Order #1011
          </Subheading>
          <DescriptionList className="mt-4">
            <DescriptionTerm>Customer</DescriptionTerm>
            <DescriptionDetails>Michael Foster</DescriptionDetails>

            <DescriptionTerm>Event</DescriptionTerm>
            <DescriptionDetails>Bear Hug: Live in Concert</DescriptionDetails>

            <DescriptionTerm>Amount</DescriptionTerm>
            <DescriptionDetails>$150.00 USD</DescriptionDetails>

            <DescriptionTerm>Amount after exchange rate</DescriptionTerm>
            <DescriptionDetails>US$150.00 &rarr; CA$199.79</DescriptionDetails>

            <DescriptionTerm>Fee</DescriptionTerm>
            <DescriptionDetails>$4.79 USD</DescriptionDetails>

            <DescriptionTerm>Net</DescriptionTerm>
            <DescriptionDetails>$1,955.00</DescriptionDetails>
          </DescriptionList>
        </div>
      </Section>
    </>
  );
}
