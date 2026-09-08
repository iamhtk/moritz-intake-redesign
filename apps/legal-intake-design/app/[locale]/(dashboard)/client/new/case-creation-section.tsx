'use client';

import { useState } from 'react';
import CreateLegalMatterForm from '@/components/cases/create-legal-case-form';
import { type CreateLegalCaseStep } from '@/components/cases/create-legal-case-constants';

export function CaseCreationSection() {
  const [step, setStep] = useState<CreateLegalCaseStep>('input');

  return <CreateLegalMatterForm step={step} onStepChange={setStep} />;
}
