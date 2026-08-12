type Props = {
  title: string;

  children:
    React.ReactNode;

  onClose: () => void;
};

export default function Modal({
  title,
  children,
  onClose,
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

          <h2 className="text-2xl font-bold">
            {title}
          </h2>

          <button
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