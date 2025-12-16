import 'server-only';

/**
 * Centralized admin authentication utility
 * Admin emails are configured via the ADMIN_EMAILS environment variable
 */

interface AdminUser {
  id: string;
  email?: string | null;
}

/**
 * Get the list of admin emails from environment variable
 * Format: comma-separated list of emails (e.g., "admin1@example.com,admin2@example.com")
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAIL || '';
  return adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
}

/**
 * Check if a user is an admin based on their email
 * @param user - User object with optional email field
 * @returns boolean - True if the user's email is in the admin list
 */
export function isAdmin(user: AdminUser | null): boolean {
  if (!user?.email) {
    return false;
  }
  
  const adminEmails = getAdminEmails();
  
  // If no admin emails are configured, deny access
  if (adminEmails.length === 0) {
    console.warn('ADMIN_EMAILS environment variable is not configured');
    return false;
  }
  
  return adminEmails.includes(user.email.toLowerCase());
}

/**
 * Check if an email is an admin email
 * @param email - Email address to check
 * @returns boolean - True if the email is in the admin list
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  
  const adminEmails = getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.warn('ADMIN_EMAILS environment variable is not configured');
    return false;
  }
  
  return adminEmails.includes(email.toLowerCase());
}
