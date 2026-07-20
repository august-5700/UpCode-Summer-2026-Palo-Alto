from ai import generate_response, summary

ourData = {"city": "San Francisco", "state": "CA", "market_trends": {"median_price": 1200000, "price_change": 5.2, "inventory": 1500}}
print(summary(ourData))
