import { useState, useEffect} from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Sala {
  id: number;
  nazwa: string;
  pojemnosc: number;
  czy_komputerowa: boolean;
}

interface SalaCreate {
  nazwa: string;
  pojemnosc: number;
  czy_komputerowa: boolean;
}

const ListaSal = () => {
  const [sale, setSale] = useState<Sala[]>([]);
  const [blad, setBlad] = useState<string>("");
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);
  
  const [nowaSala, setNowaSala] = useState<SalaCreate>({
    nazwa: '',
    pojemnosc: 30, 
    czy_komputerowa: false
  });

  const fetchSale = () => {
    axios.get<Sala[]>('http://127.0.0.1:8000/sale/')
      .then(response => {
        setSale(response.data);
        setBlad("");
      })
      .catch(() => {
        setBlad("Błąd pobierania sal. Sprawdź backend.");
      });
  };

  useEffect(() => {
    fetchSale();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNowaSala(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/sale/', nowaSala)
      .then(() => {
        fetchSale();
        setPokazFormularz(false);
        setNowaSala({ nazwa: '', pojemnosc: 30, czy_komputerowa: false });
      })
      .catch(error => {
        setBlad(`Błąd dodawania sali: ${error.message}`);
      });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-800">Sale Dydaktyczne</h3>
        <button
          onClick={() => setPokazFormularz(!pokazFormularz)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          {pokazFormularz ? 'Anuluj' : '+ Dodaj Salę'}
        </button>
      </div>

      {pokazFormularz && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Nowa Sala</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa / Numer</label>
              <input 
                type="text" name="nazwa" 
                placeholder="np. C-12" 
                value={nowaSala.nazwa} onChange={handleZmiana} 
                className="w-full p-3 border rounded-lg" required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pojemność</label>
              <input 
                type="number" name="pojemnosc" 
                value={nowaSala.pojemnosc} onChange={handleZmiana} 
                className="w-full p-3 border rounded-lg" required min="1"
              />
            </div>

            <div className="flex items-center h-full pb-4">
              <input 
                type="checkbox" name="czy_komputerowa" id="czy_komputerowa"
                checked={nowaSala.czy_komputerowa} onChange={handleZmiana} 
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="czy_komputerowa" className="ml-2 text-gray-700 font-medium">Pracownia Komputerowa?</label>
            </div>
          </div>

          <button type="submit" className="mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-md w-full md:w-auto">
            Zapisz Salę
          </button>
        </form>
      )}

      {blad && <p className="text-red-600 font-semibold mb-4">{blad}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sale.map((s) => (
          <div key={s.id} className={`p-4 rounded-lg border-l-4 shadow-sm ${s.czy_komputerowa ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-gray-800">{s.nazwa}</h4>
                <p className="text-sm text-gray-600">Pojemność: <strong>{s.pojemnosc}</strong> os.</p>
              </div>
              {s.czy_komputerowa && (
                <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">PC</span>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400 text-right">ID: {s.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaSal;