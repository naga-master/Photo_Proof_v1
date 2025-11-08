/**
 * Utility for safely handling className values
 * Prevents React warnings about invalid className props
 */

/**
 * Safely combines class names, filtering out falsy values
 * 
 * @example
 * classNames('base', condition && 'active', 'another')
 * // Returns: "base active another" or "base another"
 * 
 * @example  
 * classNames('btn', isLoading && 'loading', error && 'error')
 * // Returns: "btn loading" (if isLoading=true, error=false)
 */
export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Alternative name (commonly used)
 */
export const cn = classNames;

/**
 * Ensures a value is always a valid className string
 * Converts undefined/null to empty string
 * 
 * @example
 * safeClassName(undefined) // Returns: ""
 * safeClassName('active') // Returns: "active"
 */
export function safeClassName(value: string | undefined | null): string {
  return value || '';
}

export default classNames;
