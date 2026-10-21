from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .market_data import get_snapshot, get_history
from .research import run_research
from .sources import SOURCES

app = FastAPI(
    title="MarketLens AI API",
    description="Mobile stock research API. Data coverage varies by company.",
    version="0.1.0",
)

# Restrict this list to your production app's origins when adding a web client.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    company: str = Field(min_length=1, max_length=160)
    symbol: str = Field(min_length=1, max_length=24, pattern=r"^[A-Za-z0-9.^_-]+$")

@app.get("/")
def root():
    return {
        "app": "MarketLens AI",
        "status": "running",
        "message": "AI-powered stock research API",
        "docs": "/docs",
        "health": "/health",
        "example_stock": "/api/stocks/INFY.NS"
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)


@app.get("/health")
def health():
    return {"status": "ok", "service": "MarketLens AI API"}


@app.get("/api/stocks/{symbol}")
def stock(symbol: str):
    try:
        return get_snapshot(symbol.upper())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Market data provider failed or throttled.") from exc


@app.get("/api/stocks/{symbol}/history")
def history(symbol: str, period: str = Query("1y")):
    try:
        return get_history(symbol.upper(), period)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Unable to retrieve price history.") from exc


@app.post("/api/research")
def research(body: ResearchRequest):
    try:
        return run_research(body.company, body.symbol)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Research workflow failed.") from exc


@app.get("/api/sources")
def sources():
    return {"sources": SOURCES}
