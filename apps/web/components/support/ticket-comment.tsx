interface TicketCommentProps {
  author: string
  body: string
  createdAt: string
  onDelete?: () => void
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function TicketComment({ author, body, createdAt, onDelete }: TicketCommentProps) {
  return (
    <div className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
        {initials(author)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-900">{author}</span>
          <span className="text-[10px] text-slate-400">{formatDate(createdAt)}</span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto text-[10px] text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              🗑️
            </button>
          )}
        </div>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  )
}
