import { SystemUser, SystemUserRole } from '../types';

const STORAGE_KEY_SYSTEM_USERS = 'nouva_system_users_v1';

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    fullName: 'مدير النظام (Admin)',
    email: 'admin@nouvamarket.com',
    password: 'Aliass@m1989',
    role: 'ADMIN',
    permissions: ['ALL_PERMISSIONS'],
    status: 'ACTIVE',
    createdAt: '2025-01-01',
  },
  {
    id: 'usr-2',
    fullName: 'أمين المستودع والمورد (Warehouse)',
    email: 'warehouse@nouvamarket.com',
    password: 'Aliass@m1989',
    role: 'WAREHOUSE',
    permissions: ['PACKING', 'PICKING', 'BARCODE_SCAN', 'INVENTORY_READ_WRITE'],
    status: 'ACTIVE',
    createdAt: '2025-06-12',
  },
  {
    id: 'usr-3',
    fullName: 'سارة - مؤكدة الطلبيات',
    email: 'confirmer@nouvamarket.com',
    password: 'Aliass@m1989',
    role: 'ORDER_CONFIRMER',
    permissions: ['CONFIRM_ORDERS', 'ORDERS_MANAGE', 'FOLLOW_DELIVERY'],
    status: 'ACTIVE',
    createdAt: '2025-06-15',
  },
];

let cachedSystemUsers: SystemUser[] | null = null;
let isSyncing = false;

/**
 * Retrieve stored system users from localStorage and merge with default accounts
 */
export function getStoredSystemUsers(): SystemUser[] {
  if (typeof window === 'undefined') {
    return INITIAL_SYSTEM_USERS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_USERS);
    let list: SystemUser[] = [];
    if (raw) {
      list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    }

    // Merge default users to ensure system always has primary accounts without overwriting user changes
    const map = new Map<string, SystemUser>();
    INITIAL_SYSTEM_USERS.forEach((u) => map.set(u.id, { ...u }));
    list.forEach((u) => {
      if (u && u.id) {
        map.set(u.id, { ...map.get(u.id), ...u });
      }
    });

    const merged = Array.from(map.values());
    cachedSystemUsers = merged;

    // Trigger non-blocking sync with backend server if available
    if (!isSyncing) {
      isSyncing = true;
      fetch('/api/admin/system-users')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.users) && data.users.length > 0) {
            const serverMap = new Map<string, SystemUser>();
            merged.forEach((u) => serverMap.set(u.id, u));
            data.users.forEach((su: SystemUser) => {
              if (su && su.id) {
                serverMap.set(su.id, { ...serverMap.get(su.id), ...su });
              }
            });
            const finalMerged = Array.from(serverMap.values());
            localStorage.setItem(STORAGE_KEY_SYSTEM_USERS, JSON.stringify(finalMerged));
            cachedSystemUsers = finalMerged;
          }
        })
        .catch(() => {})
        .finally(() => {
          isSyncing = false;
        });
    }

    return merged;
  } catch (err) {
    return cachedSystemUsers || INITIAL_SYSTEM_USERS;
  }
}

/**
 * Add a new system user with password and permissions
 */
export function addSystemUser(
  userData: Omit<SystemUser, 'id' | 'createdAt'>
): SystemUser {
  const current = getStoredSystemUsers();
  const newUser: SystemUser = {
    ...userData,
    id: `usr-${Date.now().toString().slice(-5)}`,
    password: userData.password?.trim() || '123456',
    status: userData.status || 'ACTIVE',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedList = [...current, newUser];
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM_USERS, JSON.stringify(updatedList));
  } catch (e) {}
  cachedSystemUsers = updatedList;

  // Sync to server
  fetch('/api/admin/system-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser),
  }).catch(() => {});

  return newUser;
}

/**
 * Update an existing system user (name, email, password, role, permissions, status)
 */
export function updateSystemUser(
  id: string,
  updates: Partial<SystemUser>
): SystemUser | null {
  const current = getStoredSystemUsers();
  let updatedUser: SystemUser | null = null;

  const updatedList = current.map((u) => {
    if (u.id === id) {
      updatedUser = {
        ...u,
        ...updates,
        password: updates.password !== undefined ? updates.password.trim() : u.password,
      };
      return updatedUser;
    }
    return u;
  });

  if (updatedUser) {
    try {
      localStorage.setItem(STORAGE_KEY_SYSTEM_USERS, JSON.stringify(updatedList));
    } catch (e) {}
    cachedSystemUsers = updatedList;

    // Sync update to server
    fetch(`/api/admin/system-users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    }).catch(() => {});
  }

  return updatedUser;
}

/**
 * Delete a system user (prevents deleting primary admin)
 */
export function deleteSystemUser(id: string): boolean {
  if (id === 'usr-1') {
    return false; // Cannot delete super admin
  }

  const current = getStoredSystemUsers();
  const filtered = current.filter((u) => u.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM_USERS, JSON.stringify(filtered));
  } catch (e) {}
  cachedSystemUsers = filtered;

  fetch(`/api/admin/system-users/${id}`, {
    method: 'DELETE',
  }).catch(() => {});

  return true;
}

/**
 * Verify system user credentials (Email + Password)
 */
export function verifySystemUserCredentials(email: string, pass: string): SystemUser | null {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  if (!cleanEmail || !cleanPass) return null;

  const users = getStoredSystemUsers();
  const matched = users.find(
    (u) =>
      u.status === 'ACTIVE' &&
      u.email &&
      u.email.trim().toLowerCase() === cleanEmail
  );

  if (!matched) return null;

  const expectedPass = (matched.password || 'Aliass@m1989').trim();
  if (cleanPass === expectedPass) {
    return matched;
  }

  return null;
}

/**
 * Map SystemUserRole to platform user role
 */
export function mapSystemUserToAppRole(role: SystemUserRole): 'admin' | 'warehouse' | 'reseller' | 'confirmer' {
  switch (role) {
    case 'ADMIN':
    case 'FINANCE_MANAGER':
    case 'RESELLER_SUPPORT':
      return 'admin';
    case 'WAREHOUSE':
      return 'warehouse';
    case 'ORDER_CONFIRMER':
      return 'confirmer';
    default:
      return 'admin';
  }
}
