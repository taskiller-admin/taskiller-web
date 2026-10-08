"""Apply committed Django migrations and safely adopt the Alembic-owned v1 schema."""

from __future__ import annotations

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskiller.django_project.settings")

import django

django.setup()

from django.core.management import call_command  # noqa: E402
from django.db import connection  # noqa: E402
from django.db.migrations.executor import MigrationExecutor  # noqa: E402

LEGACY_ALEMBIC_HEAD = "20260930_0007"


def _domain_already_adopted() -> bool:
    with connection.cursor() as cursor:
        tables = set(connection.introspection.table_names(cursor))
        if "django_migrations" not in tables:
            return False
        cursor.execute(
            """
            SELECT 1
            FROM django_migrations
            WHERE app = 'django_domain'
            LIMIT 1
            """
        )
        return cursor.fetchone() is not None


def _verify_legacy_head() -> None:
    with connection.cursor() as cursor:
        tables = set(connection.introspection.table_names(cursor))
        if "alembic_version" not in tables:
            raise RuntimeError(
                "Taskiller domain has not been adopted by Django and no Alembic "
                "baseline was found. Bootstrap a clean database to legacy Alembic "
                f"head {LEGACY_ALEMBIC_HEAD} before the first Django adoption."
            )
        cursor.execute("SELECT version_num FROM alembic_version LIMIT 1")
        row = cursor.fetchone()
        current = str(row[0]) if row else None
    if current != LEGACY_ALEMBIC_HEAD:
        raise RuntimeError(
            f"Legacy database is at Alembic revision {current!r}; "
            f"expected {LEGACY_ALEMBIC_HEAD!r} before Django adoption."
        )


def main() -> None:
    if not _domain_already_adopted():
        _verify_legacy_head()
        # Built-in Django tables are created normally. The initial django_domain
        # migration is faked because its tables already exist from Alembic.
        call_command(
            "migrate",
            interactive=False,
            fake_initial=True,
            verbosity=1,
        )
    else:
        call_command(
            "migrate",
            interactive=False,
            verbosity=1,
        )

    executor = MigrationExecutor(connection)
    targets = executor.loader.graph.leaf_nodes()
    pending = executor.migration_plan(targets)
    if pending:
        names = ", ".join(
            f"{migration.app_label}:{migration.name}"
            for migration, _backwards in pending
        )
        raise RuntimeError(f"Django migrations remain pending: {names}")

    print("Django migration cutover OK")


if __name__ == "__main__":
    main()
