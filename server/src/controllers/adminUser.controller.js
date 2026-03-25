import User from '../models/User.js';

const canDemoteAdmin = async (targetUser) => {
  if (targetUser.role !== 'admin') {
    return true;
  }

  const adminCount = await User.countDocuments({ role: 'admin' });
  return adminCount > 1;
};

export const listAdminUsers = async (req, res, next) => {
  try {
    const items = await User.find().select('-password').sort({ createdAt: -1 }).limit(500);

    return res.json({
      success: true,
      items,
      fallbackMessage: items.length === 0 ? 'No users found.' : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminUserById = async (req, res, next) => {
  try {
    const item = await User.findById(req.params.id).select('-password');

    if (!item) {
      res.status(404);
      throw new Error('User not found');
    }

    return res.json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminUserRole = async (req, res, next) => {
  try {
    const { role } = req.validated.body;
    const target = await User.findById(req.params.id);

    if (!target) {
      res.status(404);
      throw new Error('User not found');
    }

    if (String(target._id) === String(req.user._id) && role !== 'admin') {
      res.status(400);
      throw new Error('You cannot remove your own admin role');
    }

    if (target.role === 'admin' && role !== 'admin') {
      const allowed = await canDemoteAdmin(target);
      if (!allowed) {
        res.status(400);
        throw new Error('Cannot demote the last admin user');
      }
    }

    target.role = role;
    await target.save();

    return res.json({
      success: true,
      item: {
        _id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAdminUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);

    if (!target) {
      res.status(404);
      throw new Error('User not found');
    }

    if (String(target._id) === String(req.user._id)) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    if (target.role === 'admin') {
      res.status(400);
      throw new Error('Cannot delete an admin user');
    }

    await target.deleteOne();

    return res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    return next(error);
  }
};
