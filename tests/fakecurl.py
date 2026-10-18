#!/usr/bin/env python3
"""Stand-in for curl, put first on PATH by the fake_curl fixture.

Serves canned responses from $FAKE_CURL_ROUTES (a JSON list of
{"match", "status", "body"}; first substring match on the URL wins) and logs
every call to $FAKE_CURL_LOG as one JSON line {"url", "data"}. An unrouted URL
behaves like a connection failure (exit 7, no output), so a script under test
can never reach the network. Like real curl, -f turns HTTP >= 400 into exit 22
with no body.
"""
import json, os, sys

args = sys.argv[1:]
url = next((a for a in args if a.startswith("http")), "")
data = args[args.index("--data-raw") + 1] if "--data-raw" in args else None
fail = any(a.startswith("-") and not a.startswith("--") and "f" in a for a in args)

with open(os.environ["FAKE_CURL_LOG"], "a") as f:
    f.write(json.dumps({"url": url, "data": data}) + "\n")

for route in json.load(open(os.environ["FAKE_CURL_ROUTES"])):
    if route["match"] in url:
        if route["status"] >= 400 and fail:
            sys.exit(22)
        sys.stdout.write(route["body"])
        sys.exit(0)
sys.exit(7)
