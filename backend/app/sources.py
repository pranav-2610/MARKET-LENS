"""Primary source directory for company disclosures. These are links, not scraped facts."""
SOURCES = [
    {
        "name": "NSE shareholding pattern",
        "url": "https://www.nseindia.com/companies-listing/corporate-filings-shareholding-pattern",
        "covers": ["promoter holding", "shareholding pattern"],
    },
    {
        "name": "NSE pledged data",
        "url": "https://www.nseindia.com/companies-listing/corporate-filings-pledged-data",
        "covers": ["promoter pledge disclosures"],
    },
    {
        "name": "SEBI corporate filings directory",
        "url": "https://www.sebi.gov.in/curation/corporate_filings.html",
        "covers": ["official exchange filing links"],
    },
    {
        "name": "Company investor relations",
        "url": None,
        "covers": ["annual reports", "quarterly results", "investor presentations"],
        "note": "Resolve the official company IR URL for each company before using it.",
    },
]
