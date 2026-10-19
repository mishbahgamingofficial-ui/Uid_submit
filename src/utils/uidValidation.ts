export interface UidValidationResult {
  isValid: boolean;
  normalizedUid: string;
  strengthLevel: 0 | 1 | 2 | 3;
  statusLabel: 'Empty' | 'Too short' | 'Invalid chars' | 'Ready';
  errorMessage: string | null;
}

/**
 * Normalizes a raw UID input by trimming spaces and converting to uppercase.
 */
export function normalizeUid(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}

/**
 * Validates a user's UID submission.
 * Accepts numeric or alphanumeric UIDs between 6 and 24 characters (allowing optional dashes/underscores).
 */
export function validateUid(raw: string): UidValidationResult {
  const cleaned = normalizeUid(raw);

  if (!cleaned) {
    return {
      isValid: false,
      normalizedUid: '',
      strengthLevel: 0,
      statusLabel: 'Empty',
      errorMessage: 'Please enter your UID to continue.',
    };
  }

  // Check for disallowed characters (only alphanumeric, hyphen, underscore allowed)
  if (!/^[A-Za-z0-9\-_]+$/.test(cleaned)) {
    return {
      isValid: false,
      normalizedUid: cleaned,
      strengthLevel: 1,
      statusLabel: 'Invalid chars',
      errorMessage: 'UID can only contain letters, numbers, or hyphens.',
    };
  }

  // Strip hyphens/underscores to count actual core characters
  const coreChars = cleaned.replace(/[\-_]/g, '');

  if (coreChars.length < 6) {
    return {
      isValid: false,
      normalizedUid: cleaned,
      strengthLevel: coreChars.length >= 3 ? 2 : 1,
      statusLabel: 'Too short',
      errorMessage: 'UID must be at least 6 characters long.',
    };
  }

  if (coreChars.length > 24) {
    return {
      isValid: false,
      normalizedUid: cleaned,
      strengthLevel: 1,
      statusLabel: 'Invalid chars',
      errorMessage: 'UID cannot exceed 24 characters.',
    };
  }

  return {
    isValid: true,
    normalizedUid: cleaned,
    strengthLevel: 3,
    statusLabel: 'Ready',
    errorMessage: null,
  };
}
