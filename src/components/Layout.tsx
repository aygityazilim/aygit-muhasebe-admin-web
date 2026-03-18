import { Link, useLocation, useNavigate } from 'react-router-dom'
import AygitLogo from './AygitLogo'

const MENU_ITEMS = [
  { label: 'Ön Kayıtlar', path: '/', icon: ClipboardIcon },
  { label: 'Paketler', path: '/packages', icon: PackageIcon },
  { label: 'Şirketler', path: '/companies', icon: BuildingIcon },
  { label: 'Destek Talepleri', path: '/tickets', icon: TicketIcon },
]

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
    </svg>
  )
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/registrations')
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      {/* Sidebar */}
      <aside className="w-[260px] h-full flex flex-col bg-surface-primary border-r border-border shrink-0">
        {/* Logo */}
        <div className="p-6 pb-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <AygitLogo width={110} color="#6AD140" />
            <span className="text-xs font-semibold text-content-tertiary bg-surface-secondary px-2 py-0.5 rounded-md">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200
                  ${active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary'
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200
                  ${active ? 'bg-brand-primary/15' : 'bg-surface-secondary'}
                `}>
                  <Icon className={active ? 'text-brand-primary' : 'text-content-tertiary'} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-content-secondary hover:bg-status-error-bg hover:text-status-error transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
