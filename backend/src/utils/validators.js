export const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

export const isStrongPassword = (password = "") =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password));

export const isNonEmptyString = (value, min = 1, max = 5000) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
};

export const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export const isNonNegativeInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;

export const isValidUrl = (value = "") => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const toSafeTrimmed = (value = "") => String(value).trim();
