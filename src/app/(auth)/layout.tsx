export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        overflow: 'hidden'
      }}
    >
      {children}
    </div>
  )
}
