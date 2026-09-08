'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  PanelRight,
  Play,
  Search,
  Sparkles,
  XCircle,
} from '@repo/ui/icons';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/design/design-system/button';
import { H3, Muted } from '@/components/design/design-system/typography';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Textarea } from '@/components/design/design-system/textarea';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@/components/design/foundations/components/banner';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
import { Spinner } from '@/components/design/foundations/components/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/design/foundations/components/table';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';
import { cn } from '@repo/ui/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from '@/i18n/navigation';
import {
  FirstDraftDocumentPaper,
  FirstDraftPaperScroller,
} from '@/components/design/first-drafts-admin/first-draft-document-paper';
import { DRAFT_DOCUMENT_SECTIONS } from '@/components/design/first-drafts-admin/first-drafts-data';

import {
  CALIBRATION_TREND,
  DISAGREEMENTS,
  EVAL_RUNS,
  GOLDEN_MATTERS,
  type EvalFinding,
  type EvalGate,
  type EvalRun,
  type EvalStatus,
  type FindingSeverity,
} from './ai-evals-data';

type WorkspaceTab = 'runs' | 'golden-set' | 'calibration';
type RunFilter = 'all' | EvalGate;
type StatusFilter = 'all' | EvalStatus;

const chartConfig = {
  agreement: {
    label: 'Human agreement',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const statusVariant: Record<
  EvalStatus,
  'success' | 'destructive' | 'warning' | 'info'
> = {
  Passed: 'success',
  Blocked: 'destructive',
  'Review required': 'warning',
  Running: 'info',
};

const severityVariant: Record<
  FindingSeverity,
  'destructive' | 'warning' | 'success'
> = {
  Red: 'destructive',
  Orange: 'warning',
  Green: 'success',
};

const resultVariant = {
  Pass: 'success',
  Regressed: 'warning',
  Critical: 'destructive',
} as const;

function countFindings(run: EvalRun, severity: FindingSeverity) {
  return run.findings.filter((finding) => finding.severity === severity).length;
}

function FindingCounts({ run }: { run: EvalRun }) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Finding counts">
      <span className="text-destructive text-xs font-medium tabular-nums">
        {countFindings(run, 'Red')} red
      </span>
      <span aria-hidden className="text-border">
        /
      </span>
      <span className="text-warning text-xs font-medium tabular-nums">
        {countFindings(run, 'Orange')} orange
      </span>
      <span aria-hidden className="text-border">
        /
      </span>
      <span className="text-success text-xs font-medium tabular-nums">
        {countFindings(run, 'Green')} green
      </span>
    </div>
  );
}

function FindingCard({
  finding,
  resolved,
  overrideReason,
  onResolve,
  onStartOverride,
}: {
  finding: EvalFinding;
  resolved: boolean;
  overrideReason?: string;
  onResolve: () => void;
  onStartOverride: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={severityVariant[finding.severity]}>
              {finding.severity}
            </Badge>
            <Badge variant="outline">{finding.category}</Badge>
            {resolved ? (
              <Badge variant="success">
                <Check className="size-3" />
                Resolved
              </Badge>
            ) : null}
          </div>
          <h4 className="text-foreground text-sm font-medium">
            {finding.title}
          </h4>
          <p className="text-muted-foreground mt-1 text-sm/6">
            {finding.description}
          </p>
        </div>
      </div>
      <DescriptionList className="mt-3">
        <DescriptionTerm>Location</DescriptionTerm>
        <DescriptionDetails>{finding.location}</DescriptionDetails>
        <DescriptionTerm>Recommended action</DescriptionTerm>
        <DescriptionDetails>{finding.recommendation}</DescriptionDetails>
        {overrideReason ? (
          <>
            <DescriptionTerm>Authorized override</DescriptionTerm>
            <DescriptionDetails>{overrideReason}</DescriptionDetails>
          </>
        ) : null}
      </DescriptionList>
      {!resolved ? (
        <div className="mt-4">
          {finding.severity === 'Red' ? (
            <Button variant="outline" size="sm" onClick={onStartOverride}>
              Record override
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onResolve}>
              Mark resolved
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AiEvalsWorkspace({
  initialRunId,
}: { initialRunId?: string } = {}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('runs');
  const [search, setSearch] = useState('');
  const [gateFilter, setGateFilter] = useState<RunFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedRun, setSelectedRun] = useState<EvalRun | null>(
    () => EVAL_RUNS.find((run) => run.id === initialRunId) ?? null,
  );
  const [resolvedFindingIds, setResolvedFindingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [overrideTargetId, setOverrideTargetId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isGoldenRunning, setIsGoldenRunning] = useState(false);
  const [goldenStage, setGoldenStage] = useState('');
  const isMobile = useIsMobile();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  const openRun = (run: EvalRun) => {
    setSelectedRun(run);
    setIsPanelOpen(true);
    router.push(`/admin/ai-evals/${encodeURIComponent(run.id)}`);
  };

  const filteredRuns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return EVAL_RUNS.filter((run) => {
      const matchesSearch =
        !query ||
        run.id.toLowerCase().includes(query) ||
        run.matter.toLowerCase().includes(query) ||
        run.client.toLowerCase().includes(query) ||
        run.document.toLowerCase().includes(query);
      const matchesGate = gateFilter === 'all' || run.gate === gateFilter;
      const matchesStatus =
        statusFilter === 'all' || run.status === statusFilter;
      return matchesSearch && matchesGate && matchesStatus;
    });
  }, [gateFilter, search, statusFilter]);

  const handleRunGoldenSet = () => {
    if (isGoldenRunning) return;
    setIsGoldenRunning(true);
    setGoldenStage('Loading 27 benchmark matters');
    setTimeout(() => setGoldenStage('Evaluating reference comparisons'), 900);
    setTimeout(
      () => setGoldenStage('Checking regressions and critical errors'),
      1800,
    );
    setTimeout(() => {
      setGoldenStage('');
      setIsGoldenRunning(false);
      toast.success('Golden-set run completed', {
        description:
          '24 passed, 3 need review, and no critical errors escaped.',
      });
    }, 2800);
  };

  const handleRerun = (run: EvalRun) => {
    toast.success(`${run.id} queued for re-evaluation`, {
      description: `${run.document} will be checked against the same ${run.version} snapshot.`,
    });
  };

  const saveOverride = () => {
    if (!overrideTargetId || !overrideReason.trim()) return;
    setOverrides((current) => ({
      ...current,
      [overrideTargetId]: overrideReason.trim(),
    }));
    setResolvedFindingIds((current) => new Set(current).add(overrideTargetId));
    setOverrideTargetId(null);
    setOverrideReason('');
    toast.success('Override recorded in the matter audit trail');
  };

  return (
    <div
      className={cn(
        selectedRun
          ? '-mb-10 flex h-[calc(100dvh-9rem)] min-h-[620px] flex-col transition-[padding] duration-300 ease-out'
          : 'space-y-6',
        selectedRun && (isPanelOpen ? 'md:pr-[456px]' : 'md:pr-0'),
      )}
    >
      {selectedRun ? (
        <header className="@container bg-background/80 supports-[backdrop-filter]:bg-background/68 relative z-20 -mx-4 -mt-6 flex h-14 shrink-0 items-center gap-3 px-4 backdrop-blur-[8px] backdrop-saturate-[1.25] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectedRun(null);
                router.push('/admin/ai-evals');
              }}
              aria-label="Back to eval runs"
            >
              <ArrowLeft />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {selectedRun.document}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toast.success(`${selectedRun.document} downloaded (mock).`)
              }
            >
              <Download data-icon="inline-start" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => setIsPanelOpen((value) => !value)}
              aria-expanded={isPanelOpen}
              aria-controls="eval-details-panel"
              aria-label={isPanelOpen ? 'Hide details' : 'View details'}
            >
              <PanelRight />
            </Button>
          </div>
        </header>
      ) : (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <>
            <div className="flex min-w-0 items-start gap-3">
              <div>
                <H3 asChild>
                  <h1>AI Evals</h1>
                </H3>
                <Muted className="max-w-2xl">
                  Quality gates for AI drafts and lawyer-finished work. Nothing
                  reaches a client until the submission eval passes.
                </Muted>
              </div>
            </div>
            <Button onClick={handleRunGoldenSet} disabled={isGoldenRunning}>
              {isGoldenRunning ? (
                <Spinner
                  data-icon="inline-start"
                  aria-label="Running golden set"
                />
              ) : (
                <Play data-icon="inline-start" />
              )}
              {isGoldenRunning ? 'Running golden set…' : 'Run golden set'}
            </Button>
          </>
        </header>
      )}

      {!selectedRun && isGoldenRunning ? (
        <Banner aria-live="polite">
          <Sparkles className="animate-pulse" />
          <BannerTitle>{goldenStage}</BannerTitle>
          <BannerDescription>
            Regression report will be compared with baseline 2026-07-21.
          </BannerDescription>
        </Banner>
      ) : null}

      {selectedRun ? (
        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
          <main className="h-full min-w-0">
            <FirstDraftPaperScroller>
              <FirstDraftDocumentPaper sections={DRAFT_DOCUMENT_SECTIONS} />
            </FirstDraftPaperScroller>
          </main>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as WorkspaceTab)}
          className="gap-5"
        >
          <TabsList aria-label="AI Evals workspace views">
            <TabsTrigger value="runs">Eval runs</TabsTrigger>
            <TabsTrigger value="golden-set">Golden set</TabsTrigger>
            <TabsTrigger value="calibration">Calibration</TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-sm">
                <InputGroup>
                  <InputGroupAddon>
                    <Search aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search matters, clients, documents…"
                    aria-label="Search eval runs"
                  />
                </InputGroup>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={gateFilter}
                  onValueChange={(value) => setGateFilter(value as RunFilter)}
                >
                  <SelectTrigger
                    className="w-full sm:w-44"
                    aria-label="Filter by gate"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All gates</SelectItem>
                    <SelectItem value="Pre-review">Pre-review</SelectItem>
                    <SelectItem value="Submission">Submission</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as StatusFilter)
                  }
                >
                  <SelectTrigger
                    className="w-full sm:w-48"
                    aria-label="Filter by status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Review required">
                      Review required
                    </SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Gate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow
                      key={run.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${run.id}, ${run.matter}`}
                      className="hover:bg-muted/50 focus-visible:ring-ring cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      onClick={() => openRun(run)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openRun(run);
                        }
                      }}
                    >
                      <TableCell className="max-w-[320px]">
                        <div className="text-foreground font-medium">
                          {run.matter}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {run.id} · {run.client} · {run.version}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{run.gate}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[run.status]}>
                          {run.status === 'Running' ? (
                            <Spinner aria-label="Eval running" />
                          ) : null}
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <FindingCounts run={run} />
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {run.status === 'Running' ? '—' : `${run.score}/100`}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {run.duration}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Empty className="py-10">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Search />
                            </EmptyMedia>
                            <EmptyTitle>No matching runs</EmptyTitle>
                            <EmptyDescription>
                              Adjust the search or filters to see more results.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="golden-set" className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Benchmark parity</CardDescription>
                  <CardTitle className="text-2xl">93.6%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    Win + tie rate · target ≥ 90%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Critical errors</CardDescription>
                  <CardTitle className="text-success text-2xl">0</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    Shipping gate satisfied
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Golden matters</CardDescription>
                  <CardTitle className="text-2xl">27</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    3 paper sources · up to 500 pages
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Latest regression report</CardTitle>
                  <CardDescription>
                    Pipeline candidate 7f31a9c against baseline 2026-07-21
                  </CardDescription>
                </div>
                <Badge variant="warning">3 need review</Badge>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Matter</TableHead>
                      <TableHead>Paper source</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Baseline</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {GOLDEN_MATTERS.map((matter) => (
                      <TableRow key={matter.id}>
                        <TableCell className="pl-6">
                          <div className="font-medium">{matter.matter}</div>
                          <div className="text-muted-foreground text-xs">
                            {matter.humanPreference}
                          </div>
                        </TableCell>
                        <TableCell>{matter.paperSource}</TableCell>
                        <TableCell className="tabular-nums">
                          {matter.pages}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {matter.score}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {matter.baseline}
                        </TableCell>
                        <TableCell>
                          <Badge variant={resultVariant[matter.result]}>
                            {matter.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calibration" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Eval vs. human agreement</CardTitle>
                  <CardDescription>
                    Blind labels from Pamir and Marissa, followed by Daniel on
                    legal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="h-64 w-full"
                    initialDimension={{ width: 640, height: 256 }}
                  >
                    <LineChart
                      accessibilityLayer
                      data={CALIBRATION_TREND}
                      margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        domain={[70, 100]}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) => (
                              <span className="font-mono font-medium">
                                {String(value)}%
                              </span>
                            )}
                          />
                        }
                      />
                      <Line
                        dataKey="agreement"
                        type="monotone"
                        stroke="var(--color-agreement)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-agreement)' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calibration health</CardTitle>
                  <CardDescription>
                    Current review band and drift signals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="flex items-end justify-between">
                      <span className="text-muted-foreground text-sm">
                        Agreement
                      </span>
                      <span className="text-foreground text-2xl font-semibold">
                        92%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label="Human agreement"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={92}
                      className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full"
                    >
                      <div className="bg-primary h-full w-[92%] rounded-full" />
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Above the 88% review threshold
                    </p>
                  </div>
                  <div className="border-field border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        False-red rate
                      </span>
                      <span className="font-medium">3.7%</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Missed material issues
                      </span>
                      <span className="font-medium">1.2%</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Samples this week
                      </span>
                      <span className="font-medium">27</span>
                    </div>
                  </div>
                  <Banner variant="success">
                    <CheckCircle2 />
                    <BannerTitle>No calibration drift detected</BannerTitle>
                  </Banner>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Disagreement queue</CardTitle>
                <CardDescription>
                  Samples where eval severity differs from the blind human label
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Matter</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Eval label</TableHead>
                      <TableHead>Human label</TableHead>
                      <TableHead>Reviewers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DISAGREEMENTS.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-6">
                          <div className="font-medium">{item.matter}</div>
                          <div className="text-muted-foreground text-xs">
                            {item.id}
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              severityVariant[item.evalLabel as FindingSeverity]
                            }
                          >
                            {item.evalLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.humanLabel === 'No finding' ? (
                            <Badge variant="outline">No finding</Badge>
                          ) : (
                            <Badge
                              variant={
                                severityVariant[
                                  item.humanLabel as FindingSeverity
                                ]
                              }
                            >
                              {item.humanLabel}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.reviewers}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div
        ref={setPortalContainer}
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-0 z-40 overflow-hidden [transform:translateZ(0)]',
          'md:bottom-2 md:left-2 md:right-2 md:top-[calc(var(--header-height,3rem)+0.5rem)] md:rounded-xl',
        )}
      />

      <Sheet
        modal={isMobile}
        open={selectedRun !== null && isPanelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPanelOpen(false);
            setOverrideTargetId(null);
            setOverrideReason('');
          }
        }}
      >
        <SheetContent
          id="eval-details-panel"
          side="right"
          showOverlay={isMobile}
          showCloseButton={false}
          container={portalContainer}
          className="md:border-foreground/10 gap-0 p-0 sm:max-w-md md:inset-y-0 md:right-0 md:w-[440px] md:overflow-hidden md:rounded-l-2xl md:border md:border-r-0"
          onPointerDownOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
        >
          {selectedRun ? (
            <>
              <SheetHeader>
                <SheetTitle data-font="serif" className="heading-4">
                  Evaluation details
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[selectedRun.status]}>
                    {selectedRun.status}
                  </Badge>
                  <Badge variant="outline">{selectedRun.gate}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {selectedRun.id}
                  </span>
                </div>
              </SheetHeader>

              <div className="mz-animate-step flex-1 space-y-8 overflow-y-auto px-4 pb-6">
                <DescriptionList>
                  <DescriptionTerm>Score</DescriptionTerm>
                  <DescriptionDetails>
                    {selectedRun.status === 'Running'
                      ? '—'
                      : `${selectedRun.score}/100`}
                  </DescriptionDetails>
                  <DescriptionTerm>Duration</DescriptionTerm>
                  <DescriptionDetails>
                    {selectedRun.duration}
                  </DescriptionDetails>
                  <DescriptionTerm>Version</DescriptionTerm>
                  <DescriptionDetails>{selectedRun.version}</DescriptionDetails>
                  <DescriptionTerm>Completed</DescriptionTerm>
                  <DescriptionDetails>
                    {selectedRun.completedAt}
                  </DescriptionDetails>
                </DescriptionList>

                <PanelSection title="Findings">
                  {selectedRun.findings.length > 0 ? (
                    <div className="space-y-3">
                      {selectedRun.findings.map((finding) => (
                        <div
                          key={finding.id}
                          className="border-field bg-card rounded-xl border p-4"
                        >
                          <FindingCard
                            finding={finding}
                            resolved={resolvedFindingIds.has(finding.id)}
                            overrideReason={overrides[finding.id]}
                            onResolve={() => {
                              setResolvedFindingIds((current) =>
                                new Set(current).add(finding.id),
                              );
                              toast.success('Finding marked resolved');
                            }}
                            onStartOverride={() => {
                              setOverrideTargetId(finding.id);
                              setOverrideReason('');
                            }}
                          />
                          {overrideTargetId === finding.id ? (
                            <Card size="sm" className="mt-2">
                              <CardContent>
                                <Field>
                                  <FieldLabel
                                    htmlFor={`override-${finding.id}`}
                                  >
                                    Override justification
                                  </FieldLabel>
                                  <FieldDescription>
                                    Required for the matter audit trail. Name
                                    the authority and business rationale.
                                  </FieldDescription>
                                  <Textarea
                                    id={`override-${finding.id}`}
                                    value={overrideReason}
                                    onChange={(event) =>
                                      setOverrideReason(event.target.value)
                                    }
                                    placeholder="e.g. Approved by General Counsel because…"
                                    autoFocus
                                  />
                                </Field>
                                <div className="mt-3 flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setOverrideTargetId(null);
                                      setOverrideReason('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={saveOverride}
                                    disabled={!overrideReason.trim()}
                                  >
                                    Record override
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CheckCircle2 className="text-success" />
                        </EmptyMedia>
                        <EmptyTitle>No mistakes identified</EmptyTitle>
                        <EmptyDescription>
                          This version cleared every configured eval criterion.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </PanelSection>

                <PanelSection title="Fidelity checks">
                  {selectedRun.fidelityChecks.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRun.fidelityChecks.map((check) => (
                        <div
                          key={check.label}
                          className="flex items-start gap-3"
                        >
                          {check.status === 'Passed' ? (
                            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                          ) : (
                            <XCircle className="text-destructive mt-0.5 size-4 shrink-0" />
                          )}
                          <div>
                            <p className="text-foreground text-sm font-medium">
                              {check.label}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {check.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Fidelity checks are still running.
                    </p>
                  )}
                </PanelSection>

                <PanelSection title="Run trace">
                  <DescriptionList>
                    <DescriptionTerm>Owner</DescriptionTerm>
                    <DescriptionDetails>{selectedRun.owner}</DescriptionDetails>
                    <DescriptionTerm>Submission SLA</DescriptionTerm>
                    <DescriptionDetails>
                      {selectedRun.durationSeconds <= 900
                        ? 'Within 15 minutes'
                        : 'SLA exceeded'}
                    </DescriptionDetails>
                    <DescriptionTerm>Context snapshot</DescriptionTerm>
                    <DescriptionDetails>CE-2026.07.28-4</DescriptionDetails>
                    <DescriptionTerm>Eval policy</DescriptionTerm>
                    <DescriptionDetails>EV-policy-12</DescriptionDetails>
                  </DescriptionList>
                </PanelSection>
              </div>

              <SheetFooter className="bg-background p-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleRerun(selectedRun)}
                  disabled={selectedRun.status === 'Running'}
                >
                  <Play data-icon="inline-start" />
                  Run again
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
