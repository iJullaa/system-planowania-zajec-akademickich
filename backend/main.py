from fastapi import FastAPI
from database import engine, Base
import models


Base.metadata.create_all(bind=engine)

app = FastAPI(title="System Planowania Zajęć Akademickich")

@app.get("/")
def strona_glowna():
    return {
        "status": "aktywny",
        "komunikat": "System działa, tabele w bazie powinny być utworzone."
    }