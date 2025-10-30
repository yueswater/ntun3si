export default function ManagementHeader({ title, onCreate, buttonText }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <button onClick={onCreate} className="btn btn-primary text-white">
        + {buttonText}
      </button>
    </div>
  );
}
