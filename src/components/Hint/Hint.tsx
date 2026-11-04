import './Hint.css'

type Props = {
  children: string
}

export const Hint = ({ children }: Props) => (
  <span className="hint" role="tooltip">
    {children}
  </span>
)
