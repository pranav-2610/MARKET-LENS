"""LangGraph research workflow.

This first version deliberately returns 'not verified' for data requiring primary
filings/news adapters. It does not ask an LLM to invent those facts.
"""
from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from .market_data import get_snapshot
from .sources import SOURCES


class ResearchState(TypedDict, total=False):
    company: str
    symbol: str
    snapshot: dict[str, Any]
    phases: dict[str, Any]
    report: dict[str, Any]
    errors: list[str]


def fetch_market_data(state: ResearchState) -> ResearchState:
    try:
        state["snapshot"] = get_snapshot(state["symbol"])
    except Exception as exc:
        state.setdefault("errors", []).append(f"market_data: {exc}")
    return state


def integrity_phase(state: ResearchState) -> ResearchState:
    state.setdefault("phases", {})["integrity_health"] = {
        "status": "incomplete",
        "promoter_holding": "Not verified by this starter",
        "promoter_pledge": "Not verified by this starter",
        "regulatory_news": "Not checked; connect a licensed/news and filing source",
        "debt_health": "Requires standardized financial statement adapter",
        "sources": [s for s in SOURCES if "promoter" in " ".join(s["covers"]).lower()
                    or "shareholding" in " ".join(s["covers"]).lower()],
    }
    return state


def growth_phase(state: ResearchState) -> ResearchState:
    state.setdefault("phases", {})["growth_efficiency"] = {
        "status": "incomplete",
        "revenue_cagr": None,
        "profit_cagr": None,
        "roe": (state.get("snapshot") or {}).get("roe_yahoo"),
        "roic": None,
        "free_cash_flow_margin": None,
        "competitive_moat": "Requires evidence-based company and industry research",
    }
    return state


def valuation_phase(state: ResearchState) -> ResearchState:
    snap = state.get("snapshot") or {}
    state.setdefault("phases", {})["valuation_timing"] = {
        "status": "incomplete",
        "cmp": snap.get("latest_available_close"),
        "pe_trailing": snap.get("pe_trailing"),
        "pe_forward": snap.get("pe_forward"),
        "price_to_book": snap.get("price_to_book"),
        "analyst_consensus_target": None,
        "2030_consensus_value": None,
        "dcf_intrinsic_value": None,
        "note": "Do not infer a buy/sell conclusion from missing inputs.",
    }
    return state


def synthesize(state: ResearchState) -> ResearchState:
    state["report"] = {
        "company": state.get("company"),
        "symbol": state.get("symbol"),
        "generated_at_note": "Generated at request time; see market snapshot retrieval timestamp.",
        "snapshot": state.get("snapshot"),
        "phases": state.get("phases", {}),
        "errors": state.get("errors", []),
        "verdict": "INSUFFICIENT VERIFIED DATA",
        "verdict_reason": (
            "This starter has market snapshot data only. Promoter integrity, "
            "filings, recent negative news, cash flow, peer multiples and forecasts "
            "must be verified before a responsible investment conclusion."
        ),
        "disclaimer": "Research support only; not personalized investment advice.",
    }
    return state


graph = StateGraph(ResearchState)
graph.add_node("market_data", fetch_market_data)
graph.add_node("integrity", integrity_phase)
graph.add_node("growth", growth_phase)
graph.add_node("valuation", valuation_phase)
graph.add_node("synthesize", synthesize)
graph.set_entry_point("market_data")
graph.add_edge("market_data", "integrity")
graph.add_edge("integrity", "growth")
graph.add_edge("growth", "valuation")
graph.add_edge("valuation", "synthesize")
graph.add_edge("synthesize", END)
research_graph = graph.compile()


def run_research(company: str, symbol: str) -> dict:
    state = research_graph.invoke({
        "company": company,
        "symbol": symbol.upper(),
        "phases": {},
        "errors": [],
    })
    return state["report"]
