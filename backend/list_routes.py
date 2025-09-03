from app import app

print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.rule} -> {rule.endpoint} [{', '.join(rule.methods)}]")
