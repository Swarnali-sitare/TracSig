# Flask CLI: use this app when you run `flask run`, `flask shell`, etc. (no `--app` needed).
# After pulling model changes: ./venv/bin/flask sync-schema
# Correct order if you pass --app: flask --app wsgi:app run --host 127.0.0.1 --port 5000 --reload
FLASK_APP=wsgi:app
