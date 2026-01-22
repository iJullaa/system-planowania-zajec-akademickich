import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Grupa {
  id: number;
  nazwa: string;
  liczba_studentow: number;
  kierunek: string;
}

interface GrupaCreate {
  nazwa: string;
  liczba_studentow: number;
  kierunek: string;
}

const ListaGrup = () => {
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [blad, setBlad] = useState<string>("");
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);

  const [nowaGrupa, setNowaGrupa] = useState<GrupaCreate>({
    nazwa: '',
    liczba_studentow: 20,
    kierunek: ''
  });

  const fetchGrupy = () => {
    axios.get<Grupa[]>('http://127.0.0.1:8000/grupy/')
      .then(response => {
        setGrupy(response.data);
        setBlad("");
      })
      .catch(() => {
        setBlad("Błąd pobierania grup. Sprawdź backend.");
      });
  };

  useEffect(() => {
    fetchGrupy();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNowaGrupa(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/grupy/', nowaGrupa)
      .then(() => {
        fetchGrupy();
        setPokazFormularz(false);
        setNowaGrupa({ nazwa: '', liczba_studentow: 20, kierunek: '' });
      })
      .catch(error => {
        setBlad(`Błąd dodawania: ${error.message} (Nazwa musi być unikalna!)`);
      });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-800">Grupy Studenckie</h3>
        <button
          onClick={() => setPokazFormularz(!pokazFormularz)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          {pokazFormularz ? 'Anuluj' : '+ Dodaj Grupę'}
        </button>
      </div>

      {pokazFormularz && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Nowa Grupa</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa Grupy</label>
              <input 
                type="text" name="nazwa" 
                placeholder="np. INF-S1-GR1" 
                value={nowaGrupa.nazwa} onChange={handleZmiana} 
                className="w-full p-3 border rounded-lg focus:ring-indigo-500" required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liczba Studentów</label>
              <input 
                type="number" name="liczba_studentow" 
                value={nowaGrupa.liczba_studentow} onChange={handleZmiana} 
                className="w-full p-3 border rounded-lg focus:ring-indigo-500" required min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kierunek</label>
              <input 
                type="text" name="kierunek" 
                placeholder="np. Informatyka" 
                value={nowaGrupa.kierunek} onChange={handleZmiana} 
                className="w-full p-3 border rounded-lg focus:ring-indigo-500" required 
              />
            </div>

          </div>
          <button type="submit" className="mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-md">
            Zapisz Grupę
          </button>
        </form>
      )}

      {blad && <p className="text-red-600 font-semibold mb-4">{blad}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grupy.map((g) => (
          <div key={g.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold text-indigo-700">{g.nazwa}</h4>
                <p className="text-sm text-gray-600">{g.kierunek}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{g.liczba_studentow}</div>
                <div className="text-xs text-gray-400">studentów</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaGrup;