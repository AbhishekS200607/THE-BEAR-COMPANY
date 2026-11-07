import { errorResponse } from '../utils/response.js';

export const PERMISSIONS = {
  // Orders & Fulfillment
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  FULFILLMENT_MANAGE: 'fulfillment:manage',
  // Payments & Financials
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_RECONCILE: 'payments:reconcile',
  PAYMENTS_REFUND: 'payments:refund',
  // RMA & Returns
  RMA_READ: 'rma:read',
  RMA_MANAGE: 'rma:manage',
  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_ADJUST: 'inventory:adjust',
  // Catalog & Products
  CATALOG_READ: 'catalog:read',
  CATALOG_WRITE: 'catalog:write',
  // Reviews Moderation
  REVIEWS_READ: 'reviews:read',
  REVIEWS_MODERATE: 'reviews:moderate',
  // Customers & CRM
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_EXPORT: 'customers:export',
  // Marketing & Coupons
  MARKETING_READ: 'marketing:read',
  MARKETING_WRITE: 'marketing:write',
  // Analytics & Reports
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  // Administrative Security
  STAFF_MANAGE: 'staff:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_READ: 'audit:read',
};

export const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.FULFILLMENT_MANAGE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_RECONCILE,
    PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.RMA_READ,
    PERMISSIONS.RMA_MANAGE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.CATALOG_WRITE,
    PERMISSIONS.REVIEWS_READ,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.MARKETING_READ,
    PERMISSIONS.MARKETING_WRITE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.AUDIT_READ,
  ],
  operations_manager: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.FULFILLMENT_MANAGE,
    PERMISSIONS.RMA_READ,
    PERMISSIONS.RMA_MANAGE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.ANALYTICS_READ,
  ],
  catalog_manager: [
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.CATALOG_WRITE,
    PERMISSIONS.REVIEWS_READ,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.INVENTORY_READ,
  ],
  customer_support: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.RMA_READ,
    PERMISSIONS.RMA_MANAGE,
    PERMISSIONS.REVIEWS_READ,
  ],
  finance_manager: [
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_RECONCILE,
    PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],
  marketing_manager: [
    PERMISSIONS.MARKETING_READ,
    PERMISSIONS.MARKETING_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
  analyst: [
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CATALOG_READ,
  ],
};

export const ALL_STAFF_ROLES = Object.keys(ROLE_PERMISSIONS);

/**
 * Check if a role possesses a specific permission
 */
export function roleHasPermission(role, permission) {
  if (!role) return false;
  if (role === 'super_admin') return true;
  const list = ROLE_PERMISSIONS[role] || [];
  return list.includes('*') || list.includes(permission);
}

/**
 * Express middleware to enforce one or more required permissions
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    const profile = req.adminProfile;
    if (!profile || !profile.role) {
      return errorResponse(res, 'Authentication and administrative role required', 401);
    }

    if (profile.role === 'super_admin') {
      return next();
    }

    const missing = requiredPermissions.filter((p) => !roleHasPermission(profile.role, p));
    if (missing.length > 0) {
      return errorResponse(
        res,
        `Forbidden: Role '${profile.role}' lacks required permission [${missing.join(', ')}]`,
        403
      );
    }

    next();
  };
}

