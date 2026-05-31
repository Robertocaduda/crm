'use client'

interface DeleteModalProps {
  name: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteModal({ name, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Excluir contato</h3>
        <p className="text-sm text-slate-500 mb-5">
          Tem certeza que deseja excluir <strong>{name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Excluir</button>
        </div>
      </div>
    </div>
  )
}
