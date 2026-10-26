import './Switch.css'

type Props = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export const Switch = ({ label, checked, onChange }: Props) => (
  <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
    <span className="switch__label">{label}</span>
    <span className="switch__track">
      <span className="switch__thumb" />
    </span>
  </button>
)
