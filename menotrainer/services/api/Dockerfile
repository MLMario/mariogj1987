FROM python:3.11-slim

# Copy uv binary from upstream image, uv is a package manager that we can use to with the toml file and install all dependencies and 
# and set project specifications
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app


# this are options we are setting as true, particulary important up_system_python which tells uv package manager to use the system python not a virtual env
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_SYSTEM_PYTHON=1

# default set to api, but is overriden by docker compose. the extra group references dependencies in the TOML files that are specific to the container api or worker
ARG EXTRA_GROUP=api

# Takes the build arg and persists it as an environment variable inside the container.
# This way, Python code (or shell scripts) inside the container can read EXTRA_GROUP and know if it’s the api or worker variant
ENV EXTRA_GROUP=${EXTRA_GROUP} 

# Copy TOML dependency file first to leverage Docker layer caching
# uv expects a file called pyproject.toml
COPY pyproject.toml ./pyproject.toml
COPY uv.lock ./uv.lock
COPY README.md ./README.md

# Install dependencies with uv
# 
RUN uv sync --frozen --no-cache --no-install-project

# Copy your application code
COPY app ./app

# Expose API port (worker ignores it) , 
CMD ["uvicorn","app.main:app", "--host", "0.0.0.0", "--port", "8000"]