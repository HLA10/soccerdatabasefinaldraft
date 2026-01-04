"use client";

export default function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  onKeyDown,
  step,
}: {
  label?: string;
  value: any;
  onChange: (e: any) => void;
  type?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  step?: string;
}) {
  return (
    <div className="mb-5">
      {label && (
        <label className="block mb-2 text-sm font-medium text-[#111827]">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        step={step}
        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB] text-sm"
      />
    </div>
  );
}

