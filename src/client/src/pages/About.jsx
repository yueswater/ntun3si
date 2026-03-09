import { useTranslation } from "react-i18next";
import members from "../assets/members.json";

export default function About() {
  const { t } = useTranslation();

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#03045E]">
          {t("about.title")}
        </h1>
        <p className="text-sm text-gray-400 text-right mt-1">
          {t("about.updated_date")}
        </p>
      </div>

      {/* Member Cards */}
      <div className="grid gap-8">
        {members.map((m, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6"
          >
            <img
              src={m.image}
              alt={m.name}
              className="w-36 h-36 rounded-full object-cover shrink-0"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">{m.name}</h2>
              <p className="text-[#03045E] font-medium mb-2">{m.title}</p>
              <p className="text-gray-600 leading-relaxed">{m.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
