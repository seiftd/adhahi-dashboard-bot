export function Button({ children, className = '', variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-cyan-400 text-slate-950 shadow-glow hover:bg-cyan-300',
    purple: 'bg-purple-500 text-white shadow-purple hover:bg-purple-400',
    danger: 'bg-rose-500 text-white hover:bg-rose-400',
    ghost: 'bg-white/8 text-slate-100 hover:bg-white/12 border border-white/10'
  };

  return (
    <button
      className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
