export default function ToggleRow({ label, hint, checked, onChange, disabled }) {
  return (
    <div className="settings-toggle-row">
      <div>
        <p className="settings-toggle-label">{label}</p>
        {hint && <p className="settings-toggle-hint">{hint}</p>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`settings-toggle ${checked ? 'on' : 'off'}`}
        aria-pressed={checked}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}
