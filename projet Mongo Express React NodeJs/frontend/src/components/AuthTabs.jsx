import { HiUser, HiOfficeBuilding } from "react-icons/hi";

export default function AuthTabs({ role, setRole }) {
  return (
    <div className="flex mb-6 bg-gray-100 rounded-lg overflow-hidden">
      <button
        className={`flex-1 flex items-center justify-center py-2 text-base font-medium transition ${
          role === "candidat"
            ? "bg-white text-black shadow"
            : "text-gray-500 hover:text-black"
        }`}
        onClick={() => setRole("candidat")}
        type="button"
      >
        <HiUser className="mr-2 w-5 h-5" />
        Candidat
      </button>
      <button
        className={`flex-1 flex items-center justify-center py-2 text-base font-medium transition ${
          role === "recruteur"
            ? "bg-white text-black shadow"
            : "text-gray-500 hover:text-black"
        }`}
        onClick={() => setRole("recruteur")}
        type="button"
      >
        <HiOfficeBuilding className="mr-2 w-5 h-5" />
        Recruteur
      </button>
    </div>
  );
}
