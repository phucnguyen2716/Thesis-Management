import { adminService } from '../services/api';

export const ensureAdminSeed = () => {
  // Seeding is automatically handled programmatically by the C# backend on startup
};

export const getAdminUsers = async () => {
  try {
    const res = await adminService.getUsers();
    return res.data.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      studentId: u.studentId || '',
      department: u.department || '',
      phone: u.phone || '',
      isActive: u.isActive,
    }));
  } catch (err) {
    console.error("Error fetching admin users from API:", err);
    return [];
  }
};

export const createAdminUser = async (payload) => {
  try {
    const res = await adminService.createUser({
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      studentId: payload.studentId,
      department: payload.department,
      phone: payload.phone,
      isActive: payload.isActive,
    });
    return res.data;
  } catch (err) {
    console.error("Error creating admin user:", err);
    throw err;
  }
};

export const updateAdminUser = async (id, payload) => {
  try {
    await adminService.updateUser(id, {
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      studentId: payload.studentId,
      department: payload.department,
      phone: payload.phone,
      isActive: payload.isActive,
    });
  } catch (err) {
    console.error("Error updating admin user:", err);
    throw err;
  }
};

export const deleteAdminUser = async (id) => {
  try {
    await adminService.deleteUser(id);
  } catch (err) {
    console.error("Error deleting admin user:", err);
    throw err;
  }
};

export const getLoginAudit = async () => {
  try {
    const res = await adminService.getAuditLogs();
    return res.data.map(l => ({
      id: l.id,
      email: l.email,
      role: l.role,
      success: l.success,
      message: l.message,
      userAgent: l.userAgent,
      at: new Date(l.at).getTime(),
    }));
  } catch (err) {
    console.error("Error fetching login audit logs:", err);
    return [];
  }
};

export const logLoginAttempt = () => {
  // Handled directly inside the C# AuthService during login attempts now
};

export const findUserByEmail = () => {
  // Handled on the backend now
};
