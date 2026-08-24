type Props = {
  title: string;

  children:
    React.ReactNode;

  onClose: () => void;

  qbitId?: string;
  qbitScope?: string;
};

export default function Modal({
  title,
  children,
  onClose,
  qbitId,
  qbitScope = "global",
}: Props) {

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/50
        flex
        items-center
        justify-center
        z-50
      "
    >

      <div
        data-t1eq-qbit-type={qbitId ? "page-card" : undefined}
        data-t1eq-qbit-id={qbitId || undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        className="
          bg-white
          rounded-2xl
          shadow-xl
          w-full
          max-w-2xl
          p-6
        "
      >

        <div className="flex justify-between items-center mb-6">

          <h2
            data-t1eq-qbit-type={qbitId ? "text" : undefined}
            data-t1eq-qbit-id={qbitId ? `${qbitId}-title` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            className="text-2xl font-bold"
          >
            {title}
          </h2>

          <button
            data-t1eq-qbit-type={qbitId ? "action-button" : undefined}
            data-t1eq-qbit-id={qbitId ? `${qbitId}-close` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            onClick={onClose}
            className="
              text-gray-500
              hover:text-black
            "
          >
            ✕
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}
