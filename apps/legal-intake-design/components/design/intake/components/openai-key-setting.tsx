'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Label } from '@repo/ui/components/label';
import { Check } from '@repo/ui/icons';
import { Muted } from '@/components/design/design-system/typography';
import { OPENAI_API_KEY_STORAGE } from '../openai-intake-helpers';

/**
 * Playground-only control for an OpenAI API key. The key is stored in
 * localStorage and used by the matter-intake flows to produce smarter copy
 * (guided deal sentence, review summary). It never leaves the browser.
 */
export function OpenAiKeySetting() {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setValue(window.localStorage.getItem(OPENAI_API_KEY_STORAGE) ?? '');
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    try {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        window.localStorage.setItem(OPENAI_API_KEY_STORAGE, trimmed);
      } else {
        window.localStorage.removeItem(OPENAI_API_KEY_STORAGE);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="openai-api-key" className="text-sm font-medium">
        OpenAI API key
      </Label>
      <Muted>
        Optional. Adds smarter copy to the matter-intake wizards (guided deal
        sentence, review summary). Stored only in your browser&apos;s
        localStorage and sent directly to OpenAI — never to a Moritz server.
      </Muted>
      <div className="flex max-w-sm items-center gap-2">
        <Input
          id="openai-api-key"
          type="password"
          autoComplete="off"
          placeholder="sk-…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="button" variant="outline" onClick={handleSave}>
          {saved ? <Check aria-hidden="true" className="h-4 w-4" /> : 'Save'}
        </Button>
      </div>
    </div>
  );
}
