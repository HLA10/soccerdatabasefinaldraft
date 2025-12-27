export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white shadow rounded p-4 ${className}`}>
      {children}
    </div>
  );
}

