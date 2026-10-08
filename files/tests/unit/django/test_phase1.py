from __future__ import annotations

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskiller.django_project.settings")

import django

django.setup()

from django.test import Client
from django.urls import reverse

from taskiller import __version__


def test_django_liveness_contract() -> None:
    response = Client().get(reverse("django-health-live"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["Cache-Control"] == "no-store"


def test_django_version_contract() -> None:
    response = Client().get(reverse("django-health-version"))

    assert response.status_code == 200
    assert response.json()["version"] == __version__
    assert {
        "version",
        "release_sha",
        "release_branch",
        "release_repository",
    } == set(response.json())


def test_django_admin_route_is_wired() -> None:
    response = Client().get("/admin/")

    assert response.status_code in {200, 302}
