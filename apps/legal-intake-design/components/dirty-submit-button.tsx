'use client';

import { useMemo } from 'react';
import { Button } from '@/components/design/design-system/button';

type FormValue = string | number | boolean | null | undefined;

type DirtySubmitButtonProps = {
  formId: string;
  initialValues: Record<string, FormValue>;
  currentValues: Record<string, FormValue>;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'type' | 'children'>;

function shallowFormEqual(
  a: Record<string, FormValue>,
  b: Record<string, FormValue>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function DirtySubmitButton(props: DirtySubmitButtonProps) {
  const {
    formId,
    initialValues,
    currentValues,
    disabled,
    children,
    ...buttonProps
  } = props;

  const isDirty = useMemo(
    () => !shallowFormEqual(initialValues, currentValues),
    [initialValues, currentValues],
  );

  const isDisabled = (disabled ?? false) || !isDirty;

  return (
    <Button form={formId} type="submit" disabled={isDisabled} {...buttonProps}>
      {children}
    </Button>
  );
}
