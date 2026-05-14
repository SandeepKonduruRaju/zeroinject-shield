# ── Stage: runtime ────────────────────────────────────────────────────────
# python:3.13-slim is the official image stripped of everything non-essential.
# Much smaller than python:3.13 (~50 MB vs ~1 GB).
FROM python:3.13-slim

# Set working directory inside the container.
# All subsequent COPY/RUN commands are relative to this.
WORKDIR /app

# Copy ONLY requirements first — before source code.
# WHY: Docker caches each instruction as a layer. If requirements.txt hasn't
# changed, Docker reuses the cached pip install layer and skips it entirely.
# This makes rebuilds after code changes very fast.
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Now copy the source code.
# This layer re-runs on every code change — but pip install above is cached.
COPY . .

# Document which port the app uses (informational — doesn't actually expose it).
EXPOSE 8000

# The command that runs when the container starts.
# --host 0.0.0.0 means "accept connections from outside the container"
# (not just localhost). Required for Docker networking.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
