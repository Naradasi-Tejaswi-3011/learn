// Export all models from this file for easy importing
const { Badge, UserBadge } = require('./Badge');

module.exports = {
  User: require('./User'),
  Course: require('./Course'),
  Progress: require('./Progress'),
  Badge,
  UserBadge,
  Quiz: require('./Quiz'),
  Note: require('./Note')
};
