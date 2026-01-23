import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Opcja { id: number; opis: string; }

interface Zlecenie {
  przedmiot_id: number;
  wykladowca_id: number;
  grupa_id: number;
  czas_trwania: number;
}

const DefiniowanieZajec = () => {
  const [wykladowcy, setWykladowcy] = useState<Opcja[]>([]);
  const [przedmioty, setPrzedmioty] = useState<Opcja[]>([]);
  const [grupy, setGrupy] = useState<Opcja[]>([]);
  
  const [noweZajecia, setNoweZajecia] = useState<Zlecenie>({
    przedmiot_id: 0,
    wykladowca_id: 0,
    grupa_id: 0,
    czas_trwania: 90
  });

  const [sukces, setSukces] = useState("");
  const [loadingSolver, setLoadingSolver] = useState(false);

  useEffect(() => {
    const pobierzDane = async () => {
      try {
        const [resW, resP, resG] = await Promise.all([
           axios.get('http://127.0.0.1:8000/wykladowcy/'),
           axios.get('http://127.0.0.1:8000/przedmioty/'),
           axios.get('http://127.0.0.1:8000/grupy/')
        ]);

        setWykladowcy(resW.data.map((w: any) => ({ id: w.id, opis: `${w.tytul_naukowy} ${w.nazwisko}` })));
        setPrzedmioty(resP.data.map((p: any) => ({ id: p.id, opis: `${p.nazwa} (${p.typ})` })));
        setGrupy(resG.data.map((g: any) => ({ id: g.id, opis: g.nazwa })));
      } catch (err) {
        console.error("Błąd pobierania danych słownikowych", err);
      }
    };
    pobierzDane();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setNoweZajecia({ ...noweZajecia, [e.target.name]: Number(e.target.value) });
  };

  const handleDodajDoPuli = (e: FormEvent) => {
    e.preventDefault();
    if (noweZajecia.przedmiot_id === 0 || noweZajecia.wykladowca_id === 0 || noweZajecia.grupa_id === 0) {
        alert("Wybierz wszystkie opcje!");
        return;
    }

    axios.post('http://127.0.0.1:8000/zajecia/', noweZajecia)
        .then(() => {
            setSukces("✅ Dodano zajęcia do puli oczekujących!");
            setTimeout(() => setSukces(""), 3000);
        })
        .catch(err => alert("Błąd dodawania: " + err));
  };

  const uruchomGenerator = () => {
      if (!confirm("⚠️ Czy na pewno chcesz wygenerować nowy plan?\n\nObecny harmonogram zostanie usunięty i nadpisany nowym wynikiem obliczeń.")) {
          return;
      }

      setLoadingSolver(true);
      setSukces("");

      axios.post('http://127.0.0.1:8000/generuj-plan/')
          .then(res => {
              setLoadingSolver(false);
              alert("🎉 SUKCES!\n\n" + res.data.message + "\n\nPrzejdź teraz do zakładki '2. Wynik (Plan)', aby zobaczyć harmonogram.");
          })
          .catch(err => {
              setLoadingSolver(false);
              const msg = err.response?.data?.detail || err.message;
              alert("❌ BŁĄD SOLVERA:\n" + msg);
          });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">1</span>
            Dodaj zajęcia do puli
        </h2>
        <p className="mb-6 text-gray-600">
          Zdefiniuj, jakie zajęcia mają się odbyć. Dodaj tyle pozycji, ile potrzebujesz.
        </p>

        {sukces && <div className="bg-green-100 text-green-800 p-3 rounded mb-4 font-bold text-center border border-green-200">{sukces}</div>}

        <form onSubmit={handleDodajDoPuli} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Przedmiot</label>
              <select name="przedmiot_id" onChange={handleZmiana} className="w-full p-3 border rounded shadow-sm focus:ring-2 ring-indigo-500 outline-none" required>
                <option value="0">-- Wybierz przedmiot --</option>
                {przedmioty.map(p => <option key={p.id} value={p.id}>{p.opis}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Prowadzący</label>
              <select name="wykladowca_id" onChange={handleZmiana} className="w-full p-3 border rounded shadow-sm focus:ring-2 ring-indigo-500 outline-none" required>
                <option value="0">-- Wybierz wykładowcę --</option>
                {wykladowcy.map(w => <option key={w.id} value={w.id}>{w.opis}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Grupa Studencka</label>
              <select name="grupa_id" onChange={handleZmiana} className="w-full p-3 border rounded shadow-sm focus:ring-2 ring-indigo-500 outline-none" required>
                <option value="0">-- Wybierz grupę --</option>
                {grupy.map(g => <option key={g.id} value={g.id}>{g.opis}</option>)}
              </select>
            </div>

            <div>
               <label className="block font-medium text-gray-700 mb-1">Czas trwania (minuty)</label>
               <input 
                 type="number" 
                 name="czas_trwania" 
                 value={noweZajecia.czas_trwania} 
                 onChange={handleZmiana}
                 step="15"
                 className="w-full p-3 border rounded shadow-sm focus:ring-2 ring-indigo-500 outline-none"
               />
            </div>

            <div className="md:col-span-2">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded shadow transition duration-150">
                    + Dodaj do listy oczekujących
                </button>
            </div>
        </form>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl shadow-lg border border-purple-100 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center justify-center">
            <span className="bg-purple-200 text-purple-700 p-2 rounded-lg mr-3">2</span>
            Generowanie Harmonogramu
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Gdy już dodasz wszystkie wymagane zajęcia powyżej, kliknij przycisk poniżej.
            System uruchomi algorytm optymalizacyjny (ILP), który przypisze sale i godziny, minimalizując konflikty.
        </p>

        <button 
            onClick={uruchomGenerator}
            disabled={loadingSolver}
            className={`
                w-full md:w-2/3 py-4 rounded-xl text-xl font-bold shadow-xl transition transform hover:scale-105
                ${loadingSolver 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'}
            `}
        >
            {loadingSolver ? (
                <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Trwa obliczanie optymalnego planu...
                </span>
            ) : (
                "🚀 URUCHOM GENERATOR PLANU"
            )}
        </button>
      </div>

    </div>
  );
};

export default DefiniowanieZajec;