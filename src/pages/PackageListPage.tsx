import { useEffect, useState, useCallback } from 'react'
import {
  PackageAPI,
  ResourceAPI,
  type Package,
  type ListItem,
  type PaginationResponse,
  type PackageCreatePayload,
  type PackageUpdatePayload,
} from '../api'

const PAGE_SIZE = 10

export default function PackageListPage() {
  const [pagination, setPagination] = useState<PaginationResponse<Package> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  // Resources for selection
  const [resources, setResources] = useState<ListItem[]>([])

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ key: '', name: '', description: '', resource_ids: [] as number[] })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Detail view
  const [detailPackage, setDetailPackage] = useState<Package | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const fetchData = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    setError(null)
    try {
      const skip = (currentPage - 1) * PAGE_SIZE
      const res = await PackageAPI.get(skip, PAGE_SIZE, currentSearch || undefined)
      setPagination(res.data.data)
    } catch {
      setError('Paketler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchResources = useCallback(async () => {
    try {
      const res = await ResourceAPI.getList()
      setResources(res.data.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchData(page, search)
    fetchResources()
  }, [page, search, fetchData, fetchResources])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function openCreate() {
    setEditingId(null)
    setForm({ key: '', name: '', description: '', resource_ids: [] })
    setModalError(null)
    setShowModal(true)
  }

  async function openEdit(id: number) {
    setDetailLoading(true)
    setEditingId(id)
    setModalError(null)
    try {
      const res = await PackageAPI.getOne(id)
      const pkg = res.data.data
      setForm({
        key: pkg.key,
        name: pkg.name,
        description: pkg.description || '',
        resource_ids: pkg.resources.map(r => r.id),
      })
      setShowModal(true)
    } catch {
      setError('Paket bilgileri yüklenemedi.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.key.trim() || !form.name.trim()) {
      setModalError('Anahtar ve isim alanları zorunludur.')
      return
    }
    setModalLoading(true)
    setModalError(null)
    try {
      if (editingId) {
        const payload: PackageUpdatePayload = {
          key: form.key,
          name: form.name,
          description: form.description || undefined,
          resource_ids: form.resource_ids,
        }
        await PackageAPI.update(editingId, payload)
      } else {
        const payload: PackageCreatePayload = {
          key: form.key,
          name: form.name,
          description: form.description || undefined,
          resource_ids: form.resource_ids,
        }
        await PackageAPI.create(payload)
      }
      setShowModal(false)
      fetchData(page, search)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      setModalError(axiosError?.response?.data?.error || 'İşlem sırasında hata oluştu.')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await PackageAPI.delete(deleteTarget.id)
      setDeleteTarget(null)
      fetchData(page, search)
    } catch {
      setError('Silme başarısız.')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function viewDetail(id: number) {
    setDetailId(id)
    setDetailLoading(true)
    try {
      const res = await PackageAPI.getOne(id)
      setDetailPackage(res.data.data)
    } catch {
      setError('Paket detayı yüklenemedi.')
      setDetailId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  function toggleResource(id: number) {
    setForm(prev => ({
      ...prev,
      resource_ids: prev.resource_ids.includes(id)
        ? prev.resource_ids.filter(r => r !== id)
        : [...prev.resource_ids, id],
    }))
  }

  const list = pagination?.data ?? []

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Paketler</h1>
            <p className="text-sm text-content-secondary mt-0.5">
              {pagination ? `${pagination.count} paket` : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-secondary transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Paket
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Paket adı veya anahtarı ara..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-primary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
          />
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-secondary transition-colors">
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
          <div className="bg-status-error-bg border border-status-error/20 rounded-2xl px-4 py-3 text-sm text-status-error mb-4">
            {error}
          </div>
        )}

        {!loading && !error && list.length === 0 && (
          <div className="text-center py-20 text-content-tertiary text-sm">
            {search ? 'Arama sonucu bulunamadı.' : 'Henüz paket yok.'}
          </div>
        )}

        {!loading && list.length > 0 && (
          <>
            <div className="bg-surface-primary rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Anahtar</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">İsim</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Açıklama</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Kaynaklar</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => viewDetail(pkg.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-content-secondary">{pkg.key}</td>
                      <td className="px-4 py-3 font-medium text-content-primary">{pkg.name}</td>
                      <td className="px-4 py-3 text-content-secondary">{pkg.description || <span className="text-content-tertiary">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-status-info-bg text-status-info">
                          {pkg.resources?.length ?? 0} kaynak
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEdit(pkg.id)}
                            disabled={detailLoading}
                            className="text-content-tertiary hover:text-brand-primary transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: pkg.id, name: pkg.name })}
                            className="text-content-tertiary hover:text-status-error transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

      {/* Detail Modal */}
      {detailId !== null && detailPackage && !detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-2xl border border-border shadow-sm w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-content-primary">{detailPackage.name}</h2>
              <button onClick={() => { setDetailId(null); setDetailPackage(null) }} className="text-content-tertiary hover:text-content-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-content-tertiary">Anahtar</span>
                <p className="text-sm font-mono text-content-primary">{detailPackage.key}</p>
              </div>
              {detailPackage.description && (
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Açıklama</span>
                  <p className="text-sm text-content-primary">{detailPackage.description}</p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-content-tertiary">Kaynaklar ({detailPackage.resources.length})</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailPackage.resources.map(r => (
                    <span key={r.id} className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-content-secondary">
                      {r.key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-2xl border border-border shadow-sm w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-content-primary">
                {editingId ? 'Paketi Düzenle' : 'Yeni Paket'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-content-tertiary hover:text-content-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Anahtar <span className="text-status-error">*</span>
                  </label>
                  <input
                    value={form.key}
                    onChange={(e) => setForm(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="ornek_paket"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    İsim <span className="text-status-error">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Paket Adı"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">Açıklama</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Paket açıklaması"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">
                  Kaynaklar ({form.resource_ids.length} seçili)
                </label>
                <div className="border border-border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 bg-surface-tertiary">
                  {resources.length === 0 && (
                    <p className="text-xs text-content-tertiary">Kaynak bulunamadı.</p>
                  )}
                  {resources.map(r => (
                    <label
                      key={r.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-secondary cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.resource_ids.includes(r.id)}
                        onChange={() => toggleResource(r.id)}
                        className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary/30 accent-brand-primary"
                      />
                      <span className="text-sm text-content-primary">{r.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {modalError && (
                <div className="bg-status-error-bg border border-status-error/20 rounded-xl px-3.5 py-2.5 text-sm text-status-error">
                  {modalError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-content-secondary hover:bg-surface-secondary transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {modalLoading ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-2xl border border-border shadow-sm w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-content-primary mb-2">Paketi Sil</h3>
            <p className="text-sm text-content-secondary mb-5">
              <strong>{deleteTarget.name}</strong> paketini silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-content-secondary hover:bg-surface-secondary transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-status-error text-white text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
