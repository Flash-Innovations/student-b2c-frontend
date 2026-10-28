// Shared password validation utility for Flash Student Platform
// Enforces: 8-16 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character

export const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export function evaluatePasswordRules(password = "") {
  const p = typeof password === "string" ? password : "";
  return {
    length: p.length >= 8 && p.length <= 16,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: SPECIAL_CHARS_REGEX.test(p)
  };
}

export function validatePasswordStrength(password) {
  if (typeof password !== "string" || !password) {
    return "Password is required.";
  }
  if (password.length < 8 || password.length > 16) {
    return "Password must be between 8 and 16 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!SPECIAL_CHARS_REGEX.test(password)) {
    return "Password must contain at least one special character (e.g. !@#$%^&*).";
  }
  return null;
}
