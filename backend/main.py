from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, SessionLocal, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="System Planowania Zajęć Akademickich")

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def pobierz_baze():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def strona_glowna():
    return {"status": "aktywny", "wiadomosc": "Witaj w API Systemu Planowania!"}

@app.post("/wykladowcy/", response_model=schemas.WykladowcaResponse)
def stworz_wykladowce(wykladowca: schemas.WykladowcaCreate, db: Session = Depends(pobierz_baze)):
    nowy_wykladowca = models.Wykladowca(
        imie=wykladowca.imie,
        nazwisko=wykladowca.nazwisko,
        tytul_naukowy=wykladowca.tytul_naukowy
    )
    db.add(nowy_wykladowca)
    db.commit()
    db.refresh(nowy_wykladowca)
    return nowy_wykladowca

@app.get("/wykladowcy/", response_model=List[schemas.WykladowcaResponse])
def czytaj_wykladowcow(skip: int = 0, limit: int = 100, db: Session = Depends(pobierz_baze)):
    wykladowcy = db.query(models.Wykladowca).offset(skip).limit(limit).all()
    return wykladowcy