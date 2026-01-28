/**
 * VisuallyHidden Component
 * 
 * Hides content visually but keeps it accessible to screen readers.
 * Useful for providing extra context that's not needed visually.
 * 
 * Example:
 * <button>
 *   <Icon aria-hidden="true" />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 */

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

/**
 * VisuallyHiddenInput Component
 * 
 * For custom radio/checkbox implementations that need a hidden input
 */
export function VisuallyHiddenInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="sr-only"
    />
  );
}
