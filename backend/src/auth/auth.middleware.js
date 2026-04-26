const { authenticate, requireRole } = require("../middleware/authenticate");

module.exports = {
  authenticate,
  authorizeRoles: requireRole,
};
