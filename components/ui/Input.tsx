"use client";

export default function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  onKeyDown,
}: {
  label?: string;
  value: any;
  onChange: (e: any) => void;
  type?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

