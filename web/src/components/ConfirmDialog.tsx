import Modal from "./Modal"

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "danger" | "primary"
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title}>
      <div className="space-y-4">
        <div className={`rounded-2xl p-4 ring-1 ${tone === "danger" ? "bg-rose-50 ring-rose-200 text-rose-800" : "bg-primary-50 ring-primary-200 text-primary-800"}`}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${tone === "danger" ? "btn-danger" : "btn-primary"} disabled:opacity-50`}
          >
            {loading ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
