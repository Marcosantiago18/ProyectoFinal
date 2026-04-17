import requests

def get_real_url(query):
    try:
        r = requests.get(f"https://source.unsplash.com/random/1200x800/?{query}", timeout=5)
        return r.url
    except Exception as e:
        return str(e)

print("Yachts:")
for _ in range(5): print(get_real_url("yacht"))
print("\nSailboats:")
for _ in range(5): print(get_real_url("sailboat"))
print("\nJetskis:")
for _ in range(5): print(get_real_url("jetski"))
