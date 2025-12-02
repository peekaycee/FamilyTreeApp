export function isLoggedInCookie(cookies: { [key: string]: string | undefined }) {
  return Boolean(cookies['familytree_session'])
}
