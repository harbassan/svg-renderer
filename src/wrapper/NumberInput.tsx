import { Minus, Plus } from "lucide-react";

function NumberInput({ value, onChange }: { value: number, onChange: (value: number) => void }) {
  function increment() {
    onChange(value + 1);
  }

  function decrement() {
    onChange(value - 1);
  }

  return (
    <div style={{ display: "flex", gap: "5px" }}>
      <input
        className="text-input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        type="number"
        min={1}
        max={100}
      />
      <button className="button" onClick={increment}>
        <Plus size={16} />
      </button>
      <button className="button" onClick={decrement}>
        <Minus size={16} />
      </button>
    </div>
  );
}

export default NumberInput;
