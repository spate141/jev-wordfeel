/**
 * Input normalization.
 *
 * Accepts a Unicode word or short phrase in any language. Case and language are preserved;
 * only Unicode form and whitespace are touched.
 */

import { InputValidationError } from "./errors.ts";

/** Maximum length after normalization, counted in Unicode code points. */
export const MAX_INPUT_CODE_POINTS = 80;

/** Code-point length, so astral characters count as one rather than two UTF-16 units. */
export const codePointLength = (value: string): number => [...value].length;

/**
 * Normalize to NFC, trim the ends, and collapse internal whitespace runs to a single space.
 *
 * @throws {InputValidationError} for a non-string, an empty or whitespace-only string, or more
 *   than {@link MAX_INPUT_CODE_POINTS} code points after normalization.
 */
export const normalizeInput = (input: unknown): string => {
  if (typeof input !== "string") {
    throw new InputValidationError(
      `Input must be a string; received ${input === null ? "null" : typeof input}.`,
    );
  }

  // \s covers Unicode whitespace here because the source is a normalized string, and it also
  // catches the ideographic space and non-breaking space that "short phrase" input tends to pick
  // up from copy and paste.
  const normalized = input.normalize("NFC").replace(/\s+/gu, " ").trim();

  if (normalized.length === 0) {
    throw new InputValidationError("Input must not be empty or whitespace only.");
  }

  const length = codePointLength(normalized);
  if (length > MAX_INPUT_CODE_POINTS) {
    throw new InputValidationError(
      `Input must be at most ${MAX_INPUT_CODE_POINTS} characters; received ${length}.`,
    );
  }

  return normalized;
};
