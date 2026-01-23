from pydantic import BaseModel
from typing import Optional


class WykladowcaCreate(BaseModel):
    imie: str
    nazwisko: str
    tytul_naukowy: Optional[str] = None


class WykladowcaResponse(WykladowcaCreate):
    id: int

    class Config:
        from_attributes = True

class SalaCreate(BaseModel):
    nazwa: str
    pojemnosc: int
    czy_komputerowa: bool = False

class SalaResponse(SalaCreate):
    id: int
    class Config:
        from_attributes = True

class PrzedmiotCreate(BaseModel):
    nazwa: str
    typ: str

class PrzedmiotResponse(PrzedmiotCreate):
    id: int
    class Config:
        from_attributes = True

class GrupaCreate(BaseModel):
    nazwa: str
    liczba_studentow: int
    kierunek: str

class GrupaResponse(GrupaCreate):
    id: int

class ZajeciaCreate(BaseModel):
    przedmiot_id: int
    wykladowca_id: int
    grupa_id: int
    czas_trwania: int = 90  # Domyślnie 1.5h (90 min)

class ZajeciaResponse(ZajeciaCreate):
    id: int

class EdycjaRezerwacji(BaseModel):
    nowy_dzien: str
    nowa_godzina: str
    nowa_sala_id: int

class Config:
    from_attributes = True