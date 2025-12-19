---
description: Deploy the application to Render.com using Docker
---

# Deploy to Render

This workflow outlines the steps to deploy the Goggins Habit Tracker to Render as a Dockerized service.

## Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
2.  **Render Account**: Create an account at [render.com](https://render.com).

## Steps

1.  **Push Changes**:
    Ensure all files, especially `Dockerfile` and `uv.lock`, are committed and pushed to GitHub.
    ```bash
    git add .
    git commit -m "Prepare for deployment: Add Dockerfile and consolidated build"
    git push origin main
    ```

2.  **Create Database**:
    - Log in to Render Dashboard.
    - Click **New +** -> **PostgreSQL**.
    - **Name**: `goggins-db` (or similar).
    - **User**: `goggins_user` (or leave default).
    - **Region**: Select a region close to you.
    - **Plan**: Select "Free" (for hobby projects) or higher.
    - Click **Create Database**.
    - **Wait** for it to become "Available".
    - **Copy** the "Internal Database URL" (starts with `postgres://...`).

3.  **Create Web Service**:
    - Click **New +** -> **Web Service**.
    - **Connect a repository**: Select your `goggins-habit-tracker` repo.
    - **Name**: `goggins-app`.
    - **Region**: Same as your database.
    - **Branch**: `main`.
    - **Runtime**: **Docker** (This is crucial!).
    - **Instance Type**: "Free" or higher.
    - **Environment Variables**:
        - `DATABASE_URL`: Paste the Internal Database URL from Step 2.
        - `GEMINI_API_KEY`: Paste your Gemini API Key.
        - `PYTHON_VERSION`: `3.12` (Optional, Docker handles this, but good for metadata).
        - `PORT`: `8000` (Optional, Render usually detects or sets this, but `8000` is our fallback).
    - **Health Check Path**: `/api` (since `/` might be static files, `/api` returns a JSON welcome message).

4.  **Deploy**:
    - Click **Create Web Service**.
    - Render will start building the Docker image. This might take a few minutes.
    - Watch the logs. You should see `uv sync` running, then migrations (`alembic upgrade head`), and finally `Uvicorn running on ...`.

5.  **Verify**:
    - Click the URL provided by Render (e.g., `https://goggins-app.onrender.com`).
    - You should see the application loading.
