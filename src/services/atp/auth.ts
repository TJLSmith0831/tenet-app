/**
 * Signs up a new user via AT Protocol.
 * Returns mock user data for now; replace with ATP API integration.
 *
 * @param {string} username - Desired username
 * @param {string} password - Password
 * @param {string} [email] - Optional email
 * @returns {Promise<Object>} User object including handle, did, and session
 */
export async function signupWithATP(
  username: string,
  password: string,
  email?: string,
): Promise<object> {
  if (!username || !password) {
    throw new Error('Username and password required');
  }
  // Mocked result for TDD
  return {
    username,
    handle: `${username}.tenetapp.space`,
    did: `did:plc:${Math.random().toString(36).slice(2)}`,
    email,
    session: { jwt: 'mocktoken' },
  };
}

/**
 * Logs in an existing user via AT Protocol.
 * Returns mock user data for TDD; replace with ATP API integration later.
 *
 * @param {string} username - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} User object including handle, did, and session
 */
export async function loginWithATP(username: string, password: string): Promise<object> {
  if (!username || !password) {
    throw new Error('Username and password required');
  }
  // Mocked user/session data for TDD
  return {
    username,
    handle: `${username}.tenetapp.space`,
    did: `did:plc:${Math.random().toString(36).slice(2)}`,
    session: { jwt: 'mocktoken' },
  };
}
