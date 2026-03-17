/**
 * /sign-in — canonical sign-in entry point for all roles.
 *
 * Renders the same LoginPage component that lives at /login.
 * This lets us satisfy the routing spec (/sign-in as the
 * single shared sign-in URL) without duplicating any UI code.
 */
export { default } from '../login/page'
