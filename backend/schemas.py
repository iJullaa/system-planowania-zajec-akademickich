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
    class Config:
        from_attributes = True