'use client';

import { useSyncExternalStore } from 'react';

import { getNotificationsForRole } from '@/lib/mocks/notifications';
import type { Notification, Role } from '@/lib/types';

/**
 * Notifications the playground raises while you use it — today only the
 * first-draft handoff, which has to land in the assigned lawyer's inbox for the
 * approval flow to mean anything.
 *
 * They live beside the fixtures rather than inside them: fixtures are the same
 * on every load, these are the consequence of something you just did, and they
 * are kept so a reload still shows the lawyer being notified.
 */

const STORAGE_KEY = 'playground:portal-notifications';

type RaisedNotifications = Partial<Record<Role, Notification[]>>;

const listeners = new Set<() => void>();
let raised: RaisedNotifications = {};
let loaded = false;
/** Snapshots must be referentially stable between renders. */
let cache = new Map<Role, Notification[]>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) raised = JSON.parse(stored) as RaisedNotifications;
  } catch {
    raised = {};
  }
}

function emit() {
  cache = new Map();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function raisePortalNotification(
  role: Role,
  notification: Notification,
) {
  load();
  const existing = raised[role] ?? [];
  // The same handoff must not notify twice.
  if (existing.some((item) => item.id === notification.id)) return;
  raised = { ...raised, [role]: [notification, ...existing] };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raised));
  } catch {
    // Session-only if storage is unavailable.
  }
  emit();
}

function snapshotFor(role: Role) {
  const cached = cache.get(role);
  if (cached) return cached;
  load();
  const merged = [...(raised[role] ?? []), ...getNotificationsForRole(role)];
  cache.set(role, merged);
  return merged;
}

/** The inbox for a role: what the playground raised, then the fixtures. */
export function useRoleNotifications(role: Role): Notification[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshotFor(role),
    () => getNotificationsForRole(role),
  );
}

export function useUnreadNotificationCount(role: Role): number {
  return useRoleNotifications(role).filter((item) => !item.read).length;
}
