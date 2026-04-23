export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f3ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-12%] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.12),_transparent_68%)]" />
        <div className="absolute bottom-[-18%] right-[-8%] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(5,150,105,0.14),_transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        {children}
      </div>
    </div>
  )
}
