"""Smoke the parallel Django foundation without changing schema ownership."""

from __future__ import annotations

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskiller.django_project.settings")

import django

django.setup()

from django.test import Client  # noqa: E402


def main() -> None:
    client = Client()

    live = client.get("/health/live")
    if live.status_code != 200 or live.json() != {"status": "ok"}:
        raise SystemExit(f"Django liveness failed: {live.status_code} {live.content!r}")

    ready = client.get("/health/ready")
    if ready.status_code != 200:
        raise SystemExit(f"Django readiness failed: {ready.status_code} {ready.content!r}")
    payload = ready.json()
    if payload.get("status") != "ready":
        raise SystemExit(f"Django readiness payload is not ready: {payload!r}")

    version = client.get("/health/version")
    if version.status_code != 200 or not version.json().get("version"):
        raise SystemExit(f"Django version failed: {version.status_code} {version.content!r}")

    admin_response = client.get("/admin/")
    if admin_response.status_code not in {200, 302}:
        raise SystemExit(
            f"Django admin route failed: {admin_response.status_code} {admin_response.content!r}"
        )

    print(
        "django phase-1 smoke OK: settings, PostgreSQL, Alembic revision, "
        "health endpoints, admin route"
    )


if __name__ == "__main__":
    main()
