type ToggleInputProps = React.PropsWithChildren<{
  value: string;
  onToggle: (value: string) => void;
  enabled: string;
  disabled: string;
}>

function ToggleInput({ children, value, onToggle, enabled, disabled }: ToggleInputProps) {
  const active = value === enabled;

  function handleClick() {
    if (active) onToggle(disabled);
    else onToggle(enabled);
  }

  return (
    <button className={`button ${active && "active"}`} onClick={handleClick}>
      {children}
    </button>
  );
}

export default ToggleInput;
