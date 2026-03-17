import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RegistrationAPI, ContractVerificationAPI, type Registration, type RegistrationStatus } from '../api'

const STATUS_OPTIONS: { value: RegistrationStatus; label: string }[] = [
  { value: 'pending', label: 'Bekliyor' },
  { value: 'quoted', label: 'Teklif Verildi' },
  { value: 'done', label: 'Tamamlandı' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning border-status-warning/30',
  quoted: 'bg-status-info-bg text-status-info border-status-info/30',
  done: 'bg-status-success-bg text-status-success border-status-success/30',
}

const CONTRACT_LABELS: Record<string, string> = {
  kvkk: 'KVKK Sözleşmesi',
  etk: 'ETK Onay Metni',
}

export default function RegistrationDetailPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>()
  const navigate = useNavigate()
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<RegistrationStatus>('pending')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sendingCodes, setSendingCodes] = useState(false)
  const [codesSent, setCodesSent] = useState(false)

  const [refreshing, setRefreshing] = useState(false)

  function fetchRegistration() {
    if (!trackingNumber) return
    setError(null)
    RegistrationAPI.getOne(trackingNumber)
      .then((res) => {
        const data = res.data.data
        setRegistration(data)
        setStatus(data.status)
        setName(data.name ?? '')
        setSurname(data.surname ?? '')
        setPhone(data.phone)
      })
      .catch(() => setError('Başvuru yüklenemedi.'))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => {
    fetchRegistration()
  }, [trackingNumber])

  function handleRefresh() {
    setRefreshing(true)
    fetchRegistration()
  }

  async function handleSave() {
    if (!trackingNumber) return
    setSaving(true)
    setError(null)
    try {
      await RegistrationAPI.update(trackingNumber, {
        status,
        name: name || undefined,
        surname: surname || undefined,
        phone,
      })
      const res = await RegistrationAPI.getOne(trackingNumber)
      setRegistration(res.data.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Kaydetme başarısız.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendCodes() {
    if (!trackingNumber) return
    setSendingCodes(true)
    try {
      await ContractVerificationAPI.sendCode(trackingNumber)
      setCodesSent(true)
      setTimeout(() => setCodesSent(false), 3000)
      const res = await RegistrationAPI.getOne(trackingNumber)
      setRegistration(res.data.data)
    } catch {
      setError('Kodlar gönderilemedi.')
    } finally {
      setSendingCodes(false)
    }
  }

  async function handleDelete() {
    if (!trackingNumber) return
    setDeleting(true)
    try {
      await RegistrationAPI.delete(trackingNumber)
      navigate('/')
    } catch {
      setError('Silme başarısız.')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-surface-primary border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri
          </button>
          <span className="text-content-tertiary">/</span>
          <span className="text-sm font-medium text-content-primary">Başvuru Detayı</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary border border-border hover:border-border-secondary px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Yenile
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
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

        {registration && (
          <div className="space-y-4">
            {/* Tracking number + status badge */}
            <div className="bg-surface-primary rounded-2xl border border-border p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-content-tertiary mb-1">Takip Numarası</p>
                <p className="font-mono font-semibold text-content-primary">{registration.tracking_number}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${STATUS_STYLES[registration.status]}`}>
                {STATUS_OPTIONS.find(s => s.value === registration.status)?.label}
              </span>
            </div>

            {/* Message */}
            <div className="bg-surface-primary rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-2">Mesaj</p>
              <p className="text-sm text-content-primary leading-relaxed">{registration.message}</p>
            </div>

            {/* Contracts */}
            {registration.contracts.length > 0 && (
              <div className="bg-surface-primary rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Sözleşmeler</p>
                <div className="space-y-2">
                  {registration.contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-content-primary">{CONTRACT_LABELS[contract.type] ?? contract.type}</span>
                        <a href={contract.link} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">
                          PDF
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        {contract.verified_code ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Onaylandı
                          </span>
                        ) : contract.sent_date ? (
                          <span className="text-xs text-content-tertiary">
                            Gönderildi: {new Date(contract.sent_date).toLocaleString('tr-TR')}
                          </span>
                        ) : (
                          <span className="text-xs text-content-tertiary">Kod gönderilmedi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {registration.contracts.some(c => !c.verified_code) && (
                  <button
                    onClick={handleSendCodes}
                    disabled={sendingCodes}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendingCodes ? 'Gönderiliyor...' : codesSent ? 'Kodlar Gönderildi!' : 'Doğrulama Kodlarını Gönder'}
                  </button>
                )}
              </div>
            )}

            {/* Documents */}
            {registration.document && (
              <div className="bg-surface-primary rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Belgeler</p>
                <div className="space-y-2">
                  {registration.document.tax_plate && (
                    <a
                      href={`${import.meta.env.VITE_REGISTIRATION_API_BASE_URL}/documents/uploads/${registration.document.tax_plate}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 bg-status-success-bg border border-status-success/20 rounded-xl px-4 py-3 hover:border-status-success/50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-status-success/10 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content-primary">Vergi Levhası</p>
                        <p className="text-xs text-content-tertiary truncate">{registration.document.tax_plate.split('/').pop()}</p>
                      </div>
                      <svg className="w-4 h-4 text-content-tertiary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {registration.document.other?.map((path, i) => (
                    <a
                      key={i}
                      href={`${import.meta.env.VITE_REGISTIRATION_API_BASE_URL}/documents/uploads/${path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 bg-status-info-bg border border-status-info/20 rounded-xl px-4 py-3 hover:border-status-info/50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-status-info/10 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content-primary">Diğer Belge {i + 1}</p>
                        <p className="text-xs text-content-tertiary truncate">{path.split('/').pop()}</p>
                      </div>
                      <svg className="w-4 h-4 text-content-tertiary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                  {!registration.document.tax_plate && (!registration.document.other || registration.document.other.length === 0) && (
                    <p className="text-sm text-content-tertiary">Henüz belge yüklenmemiş.</p>
                  )}
                </div>
              </div>
            )}

            {/* Editable fields */}
            <div className="bg-surface-primary rounded-2xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide">Bilgiler</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">Ad</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">Soyad</label>
                  <input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">Telefon</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">Durum</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* NES info */}
            {registration.nes_info && (
              <div className="bg-surface-primary rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">NES Bilgileri</p>
                <div className="space-y-2">
                  {Object.entries(registration.nes_info).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 text-sm">
                      <span className="text-content-tertiary min-w-32">{key}</span>
                      <span className="text-content-primary">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {registration.history.length > 0 && (
              <div className="bg-surface-primary rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Geçmiş</p>
                <div className="space-y-3">
                  {registration.history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                      <div>
                        <p className="text-sm text-content-primary">{entry.note}</p>
                        <p className="text-xs text-content-tertiary mt-0.5">
                          {new Date(entry.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="text-xs text-content-tertiary px-1">
              Oluşturulma: {new Date(registration.created_at).toLocaleString('tr-TR')}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-3 rounded-2xl border border-status-error/30 text-status-error text-sm font-medium hover:bg-status-error-bg transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-2xl border border-border shadow-sm w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-content-primary mb-2">Başvuruyu Sil</h3>
            <p className="text-sm text-content-secondary mb-5">
              Bu başvuruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-content-secondary hover:bg-surface-secondary transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-status-error text-white text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}