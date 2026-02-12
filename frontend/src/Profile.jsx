import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Dein Profil
        </h1>
        
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
          Zurück zum Dashboard
        </button>
      </section>
    </div>
  );
}