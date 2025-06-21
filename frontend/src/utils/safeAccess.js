// Utility functions for safe property access

/**
 * Safely access nested object properties
 * @param {Object} obj - The object to access
 * @param {string} path - The path to the property (e.g., 'user.profile.name')
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} The property value or default value
 */
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  } catch (error) {
    console.warn('Safe access error:', error);
    return defaultValue;
  }
};

/**
 * Safely render a component with error boundary
 * @param {Function} component - Component to render
 * @param {*} fallback - Fallback content if component fails
 * @returns {JSX.Element} The component or fallback
 */
export const safeRender = (component, fallback = null) => {
  try {
    return component();
  } catch (error) {
    console.error('Component render error:', error);
    return fallback;
  }
};

/**
 * Safely format user display name
 * @param {Object} user - User object
 * @returns {string} Formatted name or default
 */
export const safeUserName = (user) => {
  return safeGet(user, 'name', 'User');
};

/**
 * Safely get user initials
 * @param {Object} user - User object
 * @returns {string} User initials or default
 */
export const safeUserInitials = (user) => {
  const name = safeUserName(user);
  return name.charAt(0).toUpperCase();
};

/**
 * Safely format course title
 * @param {Object} course - Course object
 * @returns {string} Course title or default
 */
export const safeCourseTitle = (course) => {
  return safeGet(course, 'title', 'Untitled Course');
};

/**
 * Safely get array length
 * @param {Array} arr - Array to check
 * @returns {number} Array length or 0
 */
export const safeArrayLength = (arr) => {
  return Array.isArray(arr) ? arr.length : 0;
};

/**
 * Safely filter array and remove null/undefined items
 * @param {Array} arr - Array to filter
 * @param {Function} filterFn - Optional filter function
 * @returns {Array} Filtered array
 */
export const safeFilter = (arr, filterFn = (item) => item != null) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(filterFn);
};

/**
 * Safely map array with null checks
 * @param {Array} arr - Array to map
 * @param {Function} mapFn - Map function
 * @returns {Array} Mapped array
 */
export const safeMap = (arr, mapFn) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => item != null).map(mapFn);
};

/**
 * Safely parse number
 * @param {*} value - Value to parse
 * @param {number} defaultValue - Default value
 * @returns {number} Parsed number or default
 */
export const safeNumber = (value, defaultValue = 0) => {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely format percentage
 * @param {*} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const safePercentage = (value, decimals = 0) => {
  const num = safeNumber(value, 0);
  return `${num.toFixed(decimals)}%`;
};
