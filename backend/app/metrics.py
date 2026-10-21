"""Deterministic helpers. Expand with validated statement data before production."""
def growth_cagr(start_value, end_value, years):
    if start_value is None or end_value is None or not years or years <= 0:
        return None
    if start_value <= 0 or end_value < 0:
        return None
    return (end_value / start_value) ** (1 / years) - 1


def debt_to_equity(total_debt, total_equity):
    if total_debt is None or total_equity is None or total_equity <= 0:
        return None
    return total_debt / total_equity


def free_cash_flow(operating_cash_flow, capital_expenditure):
    if operating_cash_flow is None or capital_expenditure is None:
        return None
    # Yahoo may report capex as a negative number; normalize to a positive outflow.
    return operating_cash_flow - abs(capital_expenditure)


def dcf_per_share(forecast_fcfs, discount_rate, terminal_growth,
                  net_debt, diluted_shares):
    """Simple illustrative DCF; caller must provide currency-consistent inputs."""
    if not forecast_fcfs or diluted_shares is None or diluted_shares <= 0:
        return None
    if discount_rate <= terminal_growth or discount_rate <= -1:
        raise ValueError("discount_rate must exceed terminal_growth")
    pv = sum(cf / ((1 + discount_rate) ** year)
             for year, cf in enumerate(forecast_fcfs, start=1))
    terminal_value = forecast_fcfs[-1] * (1 + terminal_growth) / (
        discount_rate - terminal_growth
    )
    pv_terminal = terminal_value / ((1 + discount_rate) ** len(forecast_fcfs))
    net_debt = net_debt or 0
    return (pv + pv_terminal - net_debt) / diluted_shares
