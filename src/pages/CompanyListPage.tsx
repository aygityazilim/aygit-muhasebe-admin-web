import { useEffect, useState, useCallback } from 'react'
import {
  CompanyAPI,
  PackageAPI,
  type Company,
  type CompanyType,
  type ListItem,
  type PaginationResponse,
  type CompanyCreatePayload,
  type CompanyUpdatePayload,
} from '../api'

const PAGE_SIZE = 10

const TYPE_LABELS: Record<CompanyType, string> = {
  jsc: 'A.Ş.',
  llc: 'Ltd. Şti.',
  sp: 'Şahıs',
}

const TYPE_STYLES: Record<CompanyType, string> = {
  jsc: 'bg-status-info-bg text-status-info',
  llc: 'bg-status-warning-bg text-status-warning',
  sp: 'bg-status-success-bg text-status-success',
}

const EMPTY_FORM = {
  full_name: '',
  short_name: '',
  tax_number: '',
  tax_department: '',
  address: '',
  mersis_number: '',
  type: 'llc' as CompanyType,
  currency_id: 1,
  package_id: 0,
  is_accounting_firm: false,
}

export default function CompanyListPage() {
  const [pagination, setPagination] = useState<PaginationResponse<Company> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  // Packages for dropdown
  const [packages, setPackages] = useState<ListItem[]>([])

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Detail
  const [detailCompany, setDetailCompany] = useState<Company | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true)
    setError(null)
    try {
      const skip = (currentPage - 1) * PAGE_SIZE
      const res = await CompanyAPI.get(skip, PAGE_SIZE, currentSearch || undefined)
      setPagination(res.data.data)
    } catch {
      setError('Şirketler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPackages = useCallback(async () => {
    try {
      const res = await PackageAPI.getList()
      setPackages(res.data.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchData(page, search)
    fetchPackages()
  }, [page, search, fetchData, fetchPackages])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setModalError(null)
    setShowModal(true)
  }

  async function openEdit(id: number) {
    setDetailLoading(true)
    setEditingId(id)
    setModalError(null)
    try {
      const res = await CompanyAPI.getOne(id)
      const c = res.data.data
      setForm({
        full_name: c.full_name,
        short_name: c.short_name,
        tax_number: c.tax_number,
        tax_department: c.tax_department,
        address: c.address,
        mersis_number: c.mersis_number || '',
        type: c.type,
        currency_id: 1,
        package_id: c.package?.id || 0,
        is_accounting_firm: c.is_accounting_firm || false,
      })
      setShowModal(true)
    } catch {
      setError('Şirket bilgileri yüklenemedi.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.tax_number.trim()) {
      setModalError('Şirket adı ve vergi numarası zorunludur.')
      return
    }
    setModalLoading(true)
    setModalError(null)
    try {
      if (editingId) {
        const payload: CompanyUpdatePayload = {
          full_name: form.full_name,
          short_name: form.short_name,
          tax_number: form.tax_number,
          tax_department: form.tax_department,
          address: form.address,
          mersis_number: form.mersis_number || undefined,
          type: form.type,
          package_id: form.package_id || undefined,
          is_accounting_firm: form.is_accounting_firm,
          currency_id: form.currency_id,
        }
        await CompanyAPI.update(editingId, payload)
      } else {
        const payload: CompanyCreatePayload = {
          full_name: form.full_name,
          short_name: form.short_name,
          tax_number: form.tax_number,
          tax_department: form.tax_department,
          address: form.address,
          mersis_number: form.mersis_number || undefined,
          type: form.type,
          currency_id: form.currency_id,
          package_id: form.package_id,
          is_accounting_firm: form.is_accounting_firm,
        }
        await CompanyAPI.create(payload)
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
      await CompanyAPI.delete(deleteTarget.id)
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
    setDetailLoading(true)
    try {
      const res = await CompanyAPI.getOne(id)
      setDetailCompany(res.data.data)
    } catch {
      setError('Şirket detayı yüklenemedi.')
    } finally {
      setDetailLoading(false)
    }
  }

  function updateForm(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const list = pagination?.data ?? []

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Şirketler</h1>
            <p className="text-sm text-content-secondary mt-0.5">
              {pagination ? `${pagination.count} şirket` : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-secondary transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Şirket
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Şirket adı, vergi numarası veya slug ara..."
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
            {search ? 'Arama sonucu bulunamadı.' : 'Henüz şirket yok.'}
          </div>
        )}

        {!loading && list.length > 0 && (
          <>
            <div className="bg-surface-primary rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Şirket Adı</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Vergi No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Tür</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-tertiary uppercase tracking-wide">Paket</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors cursor-pointer"
                      onClick={() => viewDetail(company.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-content-primary">{company.short_name}</div>
                        <div className="text-xs text-content-tertiary">{company.full_name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-content-secondary">{company.tax_number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${TYPE_STYLES[company.type] || 'bg-surface-secondary text-content-secondary'}`}>
                          {TYPE_LABELS[company.type] || company.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-secondary text-sm">
                        {company.package?.name || <span className="text-content-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEdit(company.id)}
                            disabled={detailLoading}
                            className="text-content-tertiary hover:text-brand-primary transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: company.id, name: company.short_name })}
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
      {detailCompany && !detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-2xl border border-border shadow-sm w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-content-primary">{detailCompany.short_name}</h2>
              <button onClick={() => setDetailCompany(null)} className="text-content-tertiary hover:text-content-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Tam Adı</span>
                  <p className="text-content-primary">{detailCompany.full_name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Kısa Adı</span>
                  <p className="text-content-primary">{detailCompany.short_name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Vergi No</span>
                  <p className="text-content-primary font-mono">{detailCompany.tax_number}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Vergi Dairesi</span>
                  <p className="text-content-primary">{detailCompany.tax_department}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Tür</span>
                  <p className="text-content-primary">{TYPE_LABELS[detailCompany.type] || detailCompany.type}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Slug</span>
                  <p className="text-content-primary font-mono text-xs">{detailCompany.slug}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-content-tertiary">Adres</span>
                <p className="text-content-primary">{detailCompany.address}</p>
              </div>
              {detailCompany.mersis_number && (
                <div>
                  <span className="text-xs font-medium text-content-tertiary">MERSİS No</span>
                  <p className="text-content-primary font-mono">{detailCompany.mersis_number}</p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-content-tertiary">Paket</span>
                <p className="text-content-primary">{detailCompany.package?.name || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Mali Müşavir</span>
                  <p className="text-content-primary">{detailCompany.is_accounting_firm ? 'Evet' : 'Hayır'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">NES Kullanıcı</span>
                  <p className="text-content-primary">{detailCompany.nes_username || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-content-tertiary">Ortam</span>
                  <p className="text-content-primary">{detailCompany.environment || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-2xl border border-border shadow-sm w-full max-w-2xl mx-4 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-content-primary">
                {editingId ? 'Şirketi Düzenle' : 'Yeni Şirket'}
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
                    Tam Adı <span className="text-status-error">*</span>
                  </label>
                  <input
                    value={form.full_name}
                    onChange={(e) => updateForm('full_name', e.target.value)}
                    placeholder="Şirket Anonim Şirketi"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Kısa Adı <span className="text-status-error">*</span>
                  </label>
                  <input
                    value={form.short_name}
                    onChange={(e) => updateForm('short_name', e.target.value)}
                    placeholder="Şirket A.Ş."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Vergi Numarası <span className="text-status-error">*</span>
                  </label>
                  <input
                    value={form.tax_number}
                    onChange={(e) => updateForm('tax_number', e.target.value)}
                    placeholder="1234567890"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Vergi Dairesi <span className="text-status-error">*</span>
                  </label>
                  <input
                    value={form.tax_department}
                    onChange={(e) => updateForm('tax_department', e.target.value)}
                    placeholder="Kadıköy"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">
                  Adres <span className="text-status-error">*</span>
                </label>
                <input
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder="İstanbul, Türkiye"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">MERSİS No</label>
                  <input
                    value={form.mersis_number}
                    onChange={(e) => updateForm('mersis_number', e.target.value)}
                    placeholder="0123456789012345"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Şirket Türü <span className="text-status-error">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => updateForm('type', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  >
                    <option value="jsc">Anonim Şirket (A.Ş.)</option>
                    <option value="llc">Limited Şirket (Ltd. Şti.)</option>
                    <option value="sp">Şahıs Şirketi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Paket <span className="text-status-error">*</span>
                  </label>
                  <select
                    value={form.package_id}
                    onChange={(e) => updateForm('package_id', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  >
                    <option value={0}>Paket seçin...</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_accounting_firm}
                      onChange={(e) => updateForm('is_accounting_firm', e.target.checked)}
                      className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary/30 accent-brand-primary"
                    />
                    <span className="text-sm text-content-primary">Mali Müşavir Firması</span>
                  </label>
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
            <h3 className="text-lg font-bold text-content-primary mb-2">Şirketi Sil</h3>
            <p className="text-sm text-content-secondary mb-5">
              <strong>{deleteTarget.name}</strong> şirketini silmek istediğinize emin misiniz?
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