import os
from datetime import datetime, timedelta, timezone

tz = timezone(timedelta(seconds=3600 * 8), "Asia/Shanghai")
today = datetime.now(tz).date()

ENV_FILE = os.getenv("GITHUB_ENV")

with open(ENV_FILE, "a+", encoding="utf-8") as env_file:
    print(f"D0={today}", file=env_file)
    print(f"D1={today - timedelta(days=1)}", file=env_file)
    print(f"D2={today - timedelta(days=2)}", file=env_file)

    print(f"Y={today.year}", file=env_file)
    print(f"M={today.month:02d}", file=env_file)
    print(f"D={today.day:02d}", file=env_file)
