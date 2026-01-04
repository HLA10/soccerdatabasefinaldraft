export default function Card({
  children,
  className = "",
  hover = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`bg-white rounded-lg border border-[#E5E7EB] p-6 transition-all duration-200 ${
        hover ? "hover:shadow-md hover:border-[#D1D5DB] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

