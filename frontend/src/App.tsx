import { useState, useEffect } from 'react'
import axios from 'axios'

interface Wykladowca {
  id: number;
  imie: string;
  nazwisko: string;
  tytul_naukowy: string;
}

function App() {
  const [wykladowcy, setWykladowcy] = useState<Wykladowca[]>([])
  const [blad, setBlad] = useState<string>("")

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/wykladowcy/')
      .then(response => {
        setWykladowcy(response.data)
        console.log("Dane z backendu:", response.data)
      })
      .catch(error => {
        console.error("Błąd:", error)
        setBlad("Nie udało się połączyć z serwerem. Czy backend działa?")
      })
  }, [])

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>System Planowania Zajęć</h1>
      <hr />
      
      <h2>Lista Wykładowców</h2>
      
      {blad && <p style={{ color: "red", fontWeight: "bold" }}>⚠️ {blad}</p>}

      {!blad && wykladowcy.length === 0 && <p>Ładowanie danych...</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {wykladowcy.map((w) => (
          <li key={w.id} style={{ 
            background: "#000000ff", 
            margin: "10px 0", 
            padding: "15px", 
            borderRadius: "8px",
            borderLeft: "5px solid #007bff"
          }}>
            <strong style={{ fontSize: "1.2em" }}>
              {w.tytul_naukowy} {w.imie} {w.nazwisko}
            </strong>
            <div style={{ fontSize: "0.8em", color: "#666", marginTop: "5px" }}>
              ID w bazie: {w.id}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App