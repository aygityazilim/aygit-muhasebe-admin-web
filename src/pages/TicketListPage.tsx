import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TicketAPI, type Ticket, type PaginationResponse } from '../api'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  answered: 'Cevaplandı',
  solved: 'Çözüldü',
  closed: 'Kapatıldı',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning',
  answered: 'bg-status-info-bg text-status-info',
  solved: 'bg-status-success-bg text-status-success',
  closed: 'bg-surface-secondary text-content-tertiary',
}

const PAGE_SIZE = 10

export default function TicketListPage() {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<PaginationResponse<Ticket> | null>(null)
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
      const res = await TicketAPI.get(skip, PAGE_SIZE, currentSearch || undefined)
      setPagination(res.data.data)
    } catch {
      setError('Destek talepleri yüklenemedi.')
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

  const list = pagination?.data ?? []

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Destek Talepleri</h1>
            <p className="text-sm text-content-secondary mt-0.5">
              {pagination ? `${pagination.count} talep` : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Talep başlığı ara..."
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
            {search ? 'Arama sonucu bulunamadı.' : 'Henüz destek talebi yok.'}
          </div>
        )}

        {!loading && list.length > 0 && (
          <>
            <div className="bg-surface-primary rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Başlık</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Durum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Son Mesaj</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((ticket) => (
                    <tr
                      key={ticket.uuid}
                      className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.uuid}`)}
                    >
                      <td className="px-4 py-3 font-medium text-content-primary">{ticket.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-surface-secondary text-content-secondary'}`}>
                          {STATUS_LABELS[ticket.status] ?? ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-secondary text-xs max-w-[200px] truncate">
                        {ticket.last_message?.content ?? <span className="text-content-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3 text-content-secondary text-xs">
                        {new Date(ticket.last_message_date).toLocaleString('tr-TR')}
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
      </div>
    </div>
  )
}