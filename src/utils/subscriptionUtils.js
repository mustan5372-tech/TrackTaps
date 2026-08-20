/**
 * Centralized Utility for checking subscription validity, expiry, and benefits.
 */

/**
 * Checks whether a user's subscription is currently active and non-expired.
 * @param {Object} subscription - User subscription object from store or Firestore
 * @param {string} role - User role ('owner', 'core_admin', 'user')
 * @returns {boolean} true if premium benefits are active, false otherwise.
 */
export const checkIsPremium = (subscription, role = 'user') => {
  // 1. Owners and Core Admins always have lifetime active premium benefits
  if (role === 'owner' || role === 'core_admin') {
    return true;
  }

  // 2. Must exist and have status 'active'
  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  // 3. Lifetime plan check
  if (subscription.planType === 'lifetime' || subscription.expiryDate === '2099-12-31') {
    return true;
  }

  // 4. Expiry date check
  if (subscription.expiryDate) {
    const expiryTime = new Date(subscription.expiryDate).getTime();
    if (isNaN(expiryTime)) {
      return false;
    }
    // If current time exceeds expiry date, subscription has expired -> benefits stop!
    return expiryTime > Date.now();
  }

  // Fallback: If status is active and no expiryDate is set, treat as active
  return true;
};

/**
 * Returns human-readable status badge info for Admin Panel and User Profiles.
 * @param {Object} subscription 
 * @param {string} role 
 * @param {boolean} banned 
 * @returns {Object} { statusLabel: string, isExpired: boolean, isPaid: boolean }
 */
export const getSubscriptionDetails = (subscription = {}, role = 'user', banned = false) => {
  if (banned) {
    return { statusLabel: 'Banned', isExpired: false, isPaid: false, color: '#ef4444' };
  }

  if (role === 'owner' || role === 'admin') {
    return { statusLabel: 'Owner', isExpired: false, isPaid: true, color: '#8b5cf6' };
  }

  if (role === 'core_admin' || role === 'core') {
    return { statusLabel: 'Core Admin', isExpired: false, isPaid: true, color: '#3b82f6' };
  }

  const subStatus = subscription?.status || 'inactive';
  const expiryDate = subscription?.expiryDate;

  // Check if expired
  if (expiryDate && expiryDate !== '2099-12-31') {
    const expTime = new Date(expiryDate).getTime();
    if (!isNaN(expTime) && expTime <= Date.now()) {
      return { statusLabel: 'Expired', isExpired: true, isPaid: false, color: '#f59e0b' };
    }
  }

  if (subStatus === 'active') {
    return { statusLabel: 'Active Premium', isExpired: false, isPaid: true, color: '#d946ef' };
  }

  return { statusLabel: 'Free', isExpired: false, isPaid: false, color: '#10b981' };
};
