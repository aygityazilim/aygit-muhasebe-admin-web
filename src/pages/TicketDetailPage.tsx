import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TicketAPI, type Ticket, type TicketMessage, type TicketStatus } from '../api'

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'pending', label: 'Bekliyor' },
  { value: 'answered', label: 'Cevaplandı' },
  { value: 'solved', label: 'Çözüldü' },
  { value: 'closed', label: 'Kapatıldı' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning border-status-warning/30',
  answered: 'bg-status-info-bg text-status-info border-status-info/30',
  solved: 'bg-status-success-bg text-status-success border-status-success/30',
  closed: 'bg-surface-secondary text-content-tertiary border-border',
}

const MESSAGE_TYPE_STYLES: Record<string, { bg: string; align: string; label: string }> = {
  question: { bg: 'bg-surface-secondary', align: 'mr-auto', label: 'Müşteri' },
  answer: { bg: 'bg-brand-primary/10', align: 'ml-auto', label: 'Admin' },
}

export default function TicketDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [answerContent, setAnswerContent] = useState('')
  const [answering, setAnswering] = useState(false)

  const [statusLoading, setStatusLoading] = useState(false)

  function fetchTicket() {
    if (!uuid) return
    setError(null)
    Promise.all([
      TicketAPI.getOne(uuid),
      TicketAPI.getMessages(uuid),
    ])
      .then(([ticketRes, messagesRes]) => {
        setTicket(ticketRes.data.data)
        setMessages(messagesRes.data.data)
      })
      .catch(() => setError('Talep yüklenemedi.'))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => {
    fetchTicket()
  }, [uuid])

  function handleRefresh() {
    setRefreshing(true)
    fetchTicket()
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!uuid || !answerContent.trim()) return
    setAnswering(true)
    setError(null)
    try {
      const res = await TicketAPI.answer(uuid, answerContent.trim())
      setTicket(res.data.data)
      setAnswerContent('')
      const msgRes = await TicketAPI.getMessages(uuid)
      setMessages(msgRes.data.data)
    } catch {
      setError('Cevap gönderilemedi.')
    } finally {
      setAnswering(false)
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!uuid) return
    setStatusLoading(true)
    setError(null)
    try {
      const res = await TicketAPI.updateStatus(uuid, status)
      setTicket(res.data.data)
    } catch {
      setError('Durum güncellenemedi.')
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-surface-primary border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri
          </button>
          <span className="text-content-tertiary">/</span>
          <span className="text-sm font-medium text-content-primary">Talep Detayı</span>
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

        {ticket && (
          <div className="space-y-4">
            {/* Title + Status */}
            <div className="bg-surface-primary rounded-2xl border border-border p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-content-tertiary mb-1">Talep</p>
                <p className="font-semibold text-content-primary">{ticket.title}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${STATUS_STYLES[ticket.status]}`}>
                {STATUS_OPTIONS.find(s => s.value === ticket.status)?.label}
              </span>
            </div>

            {/* Status Update */}
            <div className="bg-surface-primary rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Durum Güncelle</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={statusLoading || ticket.status === opt.value}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                      ticket.status === opt.value
                        ? 'bg-brand-primary text-white'
                        : 'border border-border text-content-secondary hover:bg-surface-secondary disabled:opacity-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-surface-primary rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-4">Mesajlar</p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-content-tertiary text-center py-4">Henüz mesaj yok.</p>
                )}
                {[...messages].reverse().map((msg, i) => {
                  const style = MESSAGE_TYPE_STYLES[msg.type] ?? MESSAGE_TYPE_STYLES.question
                  return (
                    <div key={i} className={`max-w-[80%] ${style.align}`}>
                      <div className={`${style.bg} rounded-2xl px-4 py-3`}>
                        <p className="text-xs font-semibold text-content-tertiary mb-1">{style.label}</p>
                        <p className="text-sm text-content-primary whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs text-content-tertiary mt-1.5">
                          {new Date(msg.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Answer Form */}
            {ticket.status !== 'closed' && (
              <div className="bg-surface-primary rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Cevap Yaz</p>
                <form onSubmit={handleAnswer}>
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="Cevabınızı yazın..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors resize-none mb-3"
                  />
                  <button
                    type="submit"
                    disabled={answering || !answerContent.trim()}
                    className="w-full py-3 rounded-2xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {answering ? 'Gönderiliyor...' : 'Cevap Gönder'}
                  </button>
                </form>
              </div>
            )}

            {/* Meta */}
            <div className="text-xs text-content-tertiary px-1">
              Oluşturulma: {new Date(ticket.created_at).toLocaleString('tr-TR')}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}