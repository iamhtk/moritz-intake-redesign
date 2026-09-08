export function isNavItemActive(
  pathname: string,
  url: string,
  exact?: boolean,
): boolean {
  if (!url || url === '#') return false;
  if (exact) return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}
