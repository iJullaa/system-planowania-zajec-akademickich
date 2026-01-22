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

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/wykladowcy/').then(res => {
        setWykladowcy(res.data.map((w: any) => ({ id: w.id, opis: `${w.tytul_naukowy} ${w.nazwisko}` })));
    });
    axios.get('http://127.0.0.1:8000/przedmioty/').then(res => {
        setPrzedmioty(res.data.map((p: any) => ({ id: p.id, opis: `${p.nazwa} (${p.typ})` })));
    });
    axios.get('http://127.0.0.1:8000/grupy/').then(res => {
        setGrupy(res.data.map((g: any) => ({ id: g.id, opis: g.nazwa })));
    });
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setNoweZajecia({ ...noweZajecia, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (noweZajecia.przedmiot_id === 0 || noweZajecia.wykladowca_id === 0 || noweZajecia.grupa_id === 0) {
        alert("Wybierz wszystkie opcje!");
        return;
    }

    axios.post('http://127.0.0.1:8000/zajecia/', noweZajecia)
        .then(() => {
            setSukces("Dodano zajęcia do puli!");
            setTimeout(() => setSukces(""), 3000);
        })
        .catch(err => alert("Błąd: " + err));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Definiowanie Siatki Zajęć</h2>
      <p className="mb-6 text-gray-600">
        Tutaj łączysz zasoby w pary. Zdefiniuj, kto, co i z kim ma mieć zajęcia.
        Algorytm później zdecyduje <strong>KIEDY</strong> i <strong>GDZIE</strong>.
      </p>

      {sukces && <div className="bg-green-100 text-green-800 p-3 rounded mb-4 font-bold text-center">{sukces}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 bg-gray-50 p-6 rounded-lg border">
        
        <div>
          <label className="block font-medium text-gray-700 mb-1">Przedmiot</label>
          <select name="przedmiot_id" onChange={handleZmiana} className="w-full p-3 border rounded shadow-sm bg-white" required>
            <option value="0">-- Wybierz przedmiot --</option>
            {przedmioty.map(p => <option key={p.id} value={p.id}>{p.opis}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Prowadzący</label>
          <select name="wykladowca_id" onChange={handleZmiana} className="w-full p-3 border rounded shadow-sm bg-white" required>
            <option value="0">-- Wybierz wykładowcę --</option>
            {wykladowcy.map(w => <option key={w.id} value={w.id}>{w.opis}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Grupa Studencka</label>
          <select name="grupa_id" onChange={handleZmiana} className="w-full p-3 border rounded shadow-sm bg-white" required>
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
             className="w-full p-3 border rounded shadow-sm"
           />
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded shadow-lg mt-4 transition transform hover:scale-105">
            + Dodaj do puli do zaplanowania
        </button>

      </form>
    </div>
  );
};

export default DefiniowanieZajec;