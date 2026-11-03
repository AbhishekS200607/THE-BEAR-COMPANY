/**
 * Form validation utilities
 */

export function required(value) {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

export function email(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

/**
 * Indian mobile number: 10 digits, starting with 6-9
 */
export function phone(value) {
  return /^[6-9]\d{9}$/.test(String(value).trim().replace(/\s+/g, ''));
}

/**
 * Indian PIN code: exactly 6 digits
 */
export function pincode(value) {
  return /^\d{6}$/.test(String(value).trim());
}

export function minLength(value, min) {
  return String(value).trim().length >= min;
}

/**
 * Validate full checkout details form.
 * Returns { valid: boolean, errors: { fieldName: string } }
 */
export function validateCheckoutDetails(formData) {
  const errors = {};

  if (!required(formData.fullName)) errors.fullName = 'Full name is required.';
  else if (!minLength(formData.fullName, 2)) errors.fullName = 'Enter your full name.';

  if (!required(formData.mobile)) errors.mobile = 'Mobile number is required.';
  else if (!phone(formData.mobile)) errors.mobile = 'Enter a valid 10-digit Indian mobile number.';

  if (!required(formData.pincode)) errors.pincode = 'PIN code is required.';
  else if (!pincode(formData.pincode)) errors.pincode = 'Enter a valid 6-digit PIN code.';

  if (!required(formData.address)) errors.address = 'Address is required.';
  else if (!minLength(formData.address, 8)) errors.address = 'Please enter a complete address.';

  if (!required(formData.city)) errors.city = 'City is required.';
  if (!required(formData.state)) errors.state = 'State is required.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export default { required, email, phone, pincode, minLength, validateCheckoutDetails };

