interface Props {
  onClick: () => void
  label?: string
}

/** The pencil icon next to a Star/Constellation/Planet/Moon's name that
 *  opens its edit form in a BottomSheet. */
export function EditButton({ onClick, label = 'Edit' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="text-moon-dim hover:text-gold transition-colors shrink-0"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  )
}
