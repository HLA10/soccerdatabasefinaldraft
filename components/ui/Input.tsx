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
    <div className="mb-5">
      {label && (
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
      />
    </div>
  );
}

