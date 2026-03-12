import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegistrationAPI, type Registration, type PaginationResponse } from '../api'
import AygitLogo from '../components/AygitLogo'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  quoted: 'Teklif Verildi',
  done: 'Tamamlandı',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning',
  quoted: 'bg-status-info-bg text-status-info',
  done: 'bg-status-success-bg text-status-success',
}

const PAGE_SIZE = 10

export default function RegistrationListPage() {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<PaginationResponse<Registration> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    setError(null)
    try {
      const skip = (currentPage - 1) * PAGE_SIZE
      const res = await RegistrationAPI.get(skip, PAGE_SIZE, currentSearch || undefined)
      setPagination(res.data.data)
    } catch {
      setError('Kayıtlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page, search)
  }, [page, search, fetchData])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function handleLogout() {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  const list = pagination?.data ?? []

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-surface-primary border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AygitLogo color="#6AD140" width={90} />
          <span className="text-xs font-medium text-content-tertiary border-l border-border pl-3">Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-content-secondary hover:text-status-error transition-colors"
        >
          Çıkış Yap
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Ön Kayıt Başvuruları</h1>
            <p className="text-sm text-content-secondary mt-0.5">
              {pagination ? `${pagination.count} başvuru` : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ad, soyad, telefon veya takip numarası ara..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-primary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-secondary transition-colors"
          >
            Ara
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-border text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
            >
              Temizle
            </button>
          )}
        </form>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-status-error-bg border border-status-error/20 rounded-2xl px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        {!loading && !error && list.length === 0 && (
          <div className="text-center py-20 text-content-tertiary text-sm">
            {search ? 'Arama sonucu bulunamadı.' : 'Henüz başvuru yok.'}
          </div>
        )}

        {!loading && list.length > 0 && (
          <>
            <div className="bg-surface-primary rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Ad Soyad</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Telefon</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Takip No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Durum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Tarih</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((reg) => (
                    <tr
                      key={reg.id}
                      className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => navigate(`/registrations/${reg.tracking_number}`)}
                    >
                      <td className="px-4 py-3 font-medium text-content-primary">
                        {reg.name || reg.surname
                          ? `${reg.name ?? ''} ${reg.surname ?? ''}`.trim()
                          : <span className="text-content-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3 text-content-secondary">{reg.phone}</td>
                      <td className="px-4 py-3 text-content-secondary font-mono text-xs">{reg.tracking_number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_STYLES[reg.status] ?? 'bg-surface-secondary text-content-secondary'}`}>
                          {STATUS_LABELS[reg.status] ?? reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-secondary text-xs">
                        {new Date(reg.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-content-tertiary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-content-tertiary">
                  Sayfa {pagination.current_page} / {pagination.total_pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-content-secondary hover:bg-surface-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                    disabled={page >= pagination.total_pages}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-content-secondary hover:bg-surface-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}