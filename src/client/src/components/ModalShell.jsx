export default function ModalShell({ title, children, footer, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-base-100 rounded-lg shadow-lg w-[90%] max-w-5xl h-[90%] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-3 border-t border-base-300 flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
