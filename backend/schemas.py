from pydantic import BaseModel, ConfigDict
from typing import Optional


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class WykladowcaCreate(BaseModel):
    imie: str
    nazwisko: str
    tytul_naukowy: Optional[str] = None


class WykladowcaResponse(WykladowcaCreate, ORMModel):
    id: int


class SalaCreate(BaseModel):
    nazwa: str
    pojemnosc: int
    czy_komputerowa: bool = False


class SalaResponse(SalaCreate, ORMModel):
    id: int


class PrzedmiotCreate(BaseModel):
    nazwa: str
    typ: str


class PrzedmiotResponse(PrzedmiotCreate, ORMModel):
    id: int


class GrupaCreate(BaseModel):
    nazwa: str
    liczba_studentow: int
    kierunek: str


class GrupaResponse(GrupaCreate, ORMModel):
    id: int


class ZajeciaCreate(BaseModel):
    przedmiot_id: int
    wykladowca_id: int
    grupa_id: int
    czas_trwania: int = 90


class ZajeciaResponse(ZajeciaCreate, ORMModel):
    id: int


class EdycjaRezerwacji(BaseModel):
    nowy_dzien: str
    nowa_godzina: str
    nowa_sala_id: int