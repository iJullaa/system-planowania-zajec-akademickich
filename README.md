# System Układania Planów Zajęć Akademickich (ILP)

Projekt inżynierski realizujący system automatycznego harmonogramowania zajęć na uczelni z wykorzystaniem programowania całkowitoliczbowego.

##  Technologie

### Backend (Warstwa Logiki)
*   **Język:** Python 3.10+
*   **Framework:** FastAPI
*   **Baza danych:** PostgreSQL + SQLAlchemy
*   **Optymalizacja:** Google OR-Tools (Solver CBC)

### Frontend (Warstwa Prezentacji)
*   **Framework:** React 18 (Vite)
*   **Język:** TypeScript
*   **Komunikacja:** Axios
*   **UI:** Tailwind CSS (planowane)

##  Instrukcja uruchomienia (Lokalnie)

Aby uruchomić projekt na własnym komputerze, wykonaj poniższe kroki.

### 1. Wymagania wstępne
*   **PostgreSQL** (zainstalowany lokalnie)
*   **Node.js** (do obsługi frontendu)
*   **Python 3.10+** (do obsługi backendu)

### 2. Konfiguracja Bazy Danych
Projekt wymaga utworzenia pustej bazy danych w PostgreSQL.

1.  Uruchom **SQL Shell (psql)** lub **pgAdmin**.
2.  Zaloguj się do swojego serwera lokalnego.
3.  Wykonaj polecenie SQL:
    ```sql
    CREATE DATABASE timetable_db;
    ```
4.  W pliku `backend/database.py` upewnij się, że dane logowania (użytkownik/hasło) są zgodne z Twoją lokalną instalacją PostgreSQL:
    ```python
    DATABASE_URL = "postgresql://postgres:TWOJE_HASLO@localhost:5432/timetable_db"
    ```

*(Opcjonalnie: W projekcie znajduje się plik `docker-compose.yml` dla osób preferujących uruchamianie bazy w kontenerze).*

### 3. Uruchomienie Backendu (API)
Otwórz terminal w folderze `backend`:

```bash
# Tworzenie środowiska (tylko za pierwszym razem)
python -m venv venv

# Aktywacja środowiska (Windows PowerShell)
.\venv\Scripts\activate

# Instalacja zależności
pip install -r requirements.txt

# Start serwera
uvicorn main:app --reload
```
*API będzie dostępne pod adresem: http://127.0.0.1:8000/docs*

### 4. Uruchomienie Frontendu (Aplikacja)
Otwórz nowy terminal w folderze frontend:
```bash
# Instalacja zależności (tylko za pierwszym razem)
npm install

# Start aplikacji
npm run dev
```
*Aplikacja uruchomi się pod adresem: http://localhost:5173*
