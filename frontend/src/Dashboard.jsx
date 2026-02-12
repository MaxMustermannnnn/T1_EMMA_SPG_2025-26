import { useNavigate } from "react-router-dom";

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      {/* Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Fahrzeug-Wartungsbuch
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Übersicht über Ihre Fahrzeuge und anstehenden Wartungstermine.
        </p>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Abmelden
          </button>

          <button
            onClick={goToProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Profil
          </button>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">5</div>
          </div>
          <div className="text-sm font-medium text-gray-600">Fahrzeuge</div>
          <div className="text-xs text-gray-500">Aktiv registriert</div>
        </div>

        <div className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">1</div>
          </div>
          <div className="text-sm font-medium text-gray-600">Anstehende Wartungen</div>
          <div className="text-xs text-gray-500">In den nächsten 30 Tagen</div>
        </div>
      </section>
    </div>
  );
}
