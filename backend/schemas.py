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