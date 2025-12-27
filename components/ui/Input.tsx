"use client";

export default function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label?: string;
  value: any;
  onChange: (e: any) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

