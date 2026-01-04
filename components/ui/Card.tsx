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
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 ${
        hover ? "hover:shadow-lg hover:border-blue-200 hover:-translate-y-1" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

