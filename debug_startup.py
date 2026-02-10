import sys
import time

print("Starting debug import...")

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

try:
    log("Importing backend.database...")
    from backend import database
    log("DONE backend.database")

    log("Importing backend.models...")
    from backend import models
    log("DONE backend.models")

    log("Importing backend.api.auth...")
    from backend.api import auth
    log("DONE backend.api.auth")

    log("Importing backend.api.videos...")
    from backend.api import videos
    log("DONE backend.api.videos")

    log("Importing backend.main...")
    from backend import main
    log("DONE backend.main")

    log("Startup check complete!")

except Exception as e:
    log(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
