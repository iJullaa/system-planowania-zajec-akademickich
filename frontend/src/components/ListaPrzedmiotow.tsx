import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Przedmiot {
  id: number;
  nazwa: string;
  typ: string;
}

interface PrzedmiotCreate {
  nazwa: string;
  typ: string;
}

const ListaPrzedmiotow = () => {
  const [przedmioty, setPrzedmioty] = useState<Przedmiot[]>([]);
  const [blad, setBlad] = useState<string>("");
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);

  const [nowyPrzedmiot, setNowyPrzedmiot] = useState<PrzedmiotCreate>({
    nazwa: '',
    typ: 'Wykład' 
  });

  const fetchPrzedmioty = () => {
    axios.get<Przedmiot[]>('http://127.0.0.1:8000/przedmioty/')
      .then(response => {
        setPrzedmioty(response.data);
        setBlad("");
      })
      .catch(() => {
        setBlad("Błąd pobierania przedmiotów.");
      });
  };

  useEffect(() => {
    fetchPrzedmioty();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNowyPrzedmiot(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/przedmioty/', nowyPrzedmiot)
      .then(() => {
        fetchPrzedmioty();
        setPokazFormularz(false);
        setNowyPrzedmiot({ nazwa: '', typ: 'Wykład' });
      })
      .catch(error => {
        setBlad(`Błąd dodawania: ${error.message}`);
      });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-800">Przedmioty / Kursy</h3>
        <button
          onClick={() => setPokazFormularz(!pokazFormularz)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          {pokazFormularz ? 'Anuluj' : '+ Dodaj Przedmiot'}
        </button>
      </div>

      {pokazFormularz && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Nowy Przedmiot</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa Przedmiotu</label>
              <input 
                type="text" name="nazwa" 
                placeholder="np. Analiza Matematyczna" 
                value={nowyPrzedmiot.nazwa} onChange={handleZmiana} 
                className="w-full p-3 border rounded-lg focus:ring-indigo-500" required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ Zajęć</label>
              <select 
                name="typ" 
                value={nowyPrzedmiot.typ} 
                onChange={handleZmiana}
                className="w-full p-3 border rounded-lg focus:ring-indigo-500 bg-white"
              >
                <option value="Wykład">Wykład</option>
                <option value="Laboratorium">Laboratorium</option>
                <option value="Ćwiczenia">Ćwiczenia</option>
                <option value="Projekt">Projekt</option>
              </select>
            </div>

          </div>
          <button type="submit" className="mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-md">
            Zapisz Przedmiot
          </button>
        </form>
      )}

      {blad && <p className="text-red-600 font-semibold mb-4">{blad}</p>}

      <div className="space-y-3">
        {przedmioty.map((p) => (
          <div key={p.id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition bg-gray-50">
            <div>
              <h4 className="text-lg font-bold text-gray-800">{p.nazwa}</h4>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                p.typ === 'Wykład' ? 'bg-yellow-200 text-yellow-800' :
                p.typ === 'Laboratorium' ? 'bg-blue-200 text-blue-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {p.typ}
              </span>
            </div>
            <div className="text-sm text-gray-400">ID: {p.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaPrzedmiotow;