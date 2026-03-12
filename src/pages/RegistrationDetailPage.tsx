import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RegistrationAPI, type Registration, type RegistrationStatus } from '../api'

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

  useEffect(() => {
    if (!trackingNumber) return
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
      .finally(() => setLoading(false))
  }, [trackingNumber])

  async function handleSave() {
    if (!trackingNumber) return
    setSaving(true)
    setError(null)
    try {
      const res = await RegistrationAPI.update(trackingNumber, {
        status,
        name: name || undefined,
        surname: surname || undefined,
        phone,
      })
      setRegistration(res.data.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Kaydetme başarısız.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-surface-primary border-b border-border px-6 py-4 flex items-center gap-3">
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
                      {contract.verified_code ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Onaylandı
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-status-warning">Onay Bekliyor</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {registration.document && (
              <div className="bg-surface-primary rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Belgeler</p>
                <div className="space-y-2">
                  {registration.document.tax_plate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-content-primary">Vergi Levhası</span>
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/documents/uploads/${registration.document.tax_plate}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-primary hover:underline"
                      >
                        Görüntüle
                      </a>
                    </div>
                  )}
                  {registration.document.other?.map((path, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-content-primary">Diğer Belge {i + 1}</span>
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/documents/uploads/${path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-primary hover:underline"
                      >
                        Görüntüle
                      </a>
                    </div>
                  ))}
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

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}