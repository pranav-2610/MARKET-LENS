from __future__ import annotations
from datetime import datetime, timezone
import math
import yfinance as yf


def _number(value):
    try:
        if value is None:
            return None
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError):
        return None


def get_snapshot(symbol: str) -> dict:
    """Return available Yahoo Finance fields; never label daily close as live CMP."""
    ticker = yf.Ticker(symbol)
    info = ticker.info or {}
    hist = ticker.history(period="1y", auto_adjust=False)
    if hist.empty:
        raise ValueError(f"No price history found for ticker '{symbol}'.")

    latest = hist.iloc[-1]
    high = _number(hist["High"].max())
    low = _number(hist["Low"].min())
    close = _number(latest.get("Close"))
    index = hist.index[-1]
    bar_date = str(index.date()) if hasattr(index, "date") else str(index)

    # yfinance keys are inconsistent across symbols. Null means unavailable.
    return {
        "symbol": symbol.upper(),
        "company_name": info.get("longName") or info.get("shortName"),
        "exchange": info.get("exchange"),
        "currency": info.get("currency"),
        "latest_available_close": close,
        "latest_bar_date": bar_date,
        "quote_type": "latest available daily bar; not guaranteed real-time",
        "week_52_high": high,
        "week_52_low": low,
        "pe_trailing": _number(info.get("trailingPE")),
        "pe_forward": _number(info.get("forwardPE")),
        "price_to_book": _number(info.get("priceToBook")),
        "eps_trailing": _number(info.get("trailingEps")),
        "roe_yahoo": _number(info.get("returnOnEquity")),
        "dividend_yield_yahoo": _number(info.get("dividendYield")),
        "market_cap": _number(info.get("marketCap")),
        "beta": _number(info.get("beta")),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "history_points": int(len(hist)),
        "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance via yfinance (unofficial interface)",
        "data_quality_note": "Check timestamp and source coverage; unavailable fields are null.",
    }


def get_history(symbol: str, period: str = "1y") -> dict:
    allowed = {"1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "max"}
    if period not in allowed:
        raise ValueError(f"period must be one of {sorted(allowed)}")
    hist = yf.Ticker(symbol).history(period=period, auto_adjust=False)
    points = []
    for index, row in hist.iterrows():
        close = _number(row.get("Close"))
        if close is not None:
            points.append({
                "date": str(index.date()),
                "close": close,
                "volume": int(row["Volume"]) if row.get("Volume") is not None else None,
            })
    return {"symbol": symbol.upper(), "period": period, "points": points,
            "source": "Yahoo Finance via yfinance"}
