




def filter_listings(listings, filters):
    l2 = []
    for listing in listings:
        is_good = True
        for filter in filters:
            if not filter(listing):
                is_good = False
                break
        if is_good:
            l2.append(listing)
    return listings
        
def sort_listings(listings, score_function):
    listings.sort(key=lambda x: score_function(x))

def prepare_listings(listings, filters, score_function):
    l = filter_listings(listings, filters)
    sort_listings(l, score_function)
    return l