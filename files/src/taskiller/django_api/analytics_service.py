from __future__ import annotations

from uuid import UUID

from asgiref.sync import sync_to_async

from taskiller.analytics.derive import EventRecord
from taskiller.analytics.service import AnalyticsService, LoadedHistory
from taskiller.django_api.errors import TaskillerAPIError
from taskiller.django_domain.models import (
    ExecutionSession,
    SessionEvent,
    SessionReview,
    UserPreferences,
    WorkItem,
    WorkType,
)


class DjangoAnalyticsService(AnalyticsService):
    """Keep proven metric math; load its history through Django ORM."""

    def __init__(self, *, owner_id: UUID) -> None:
        super().__init__(None, owner_id=owner_id)  # type: ignore[arg-type]

    async def _load_history(self, to_at):  # type: ignore[override]
        return await sync_to_async(
            self._load_history_sync,
            thread_sensitive=True,
        )(to_at)

    def _load_history_sync(self, to_at):
        sessions = list(
            ExecutionSession.objects.filter(
                owner_id=self.owner_id,
                session_started_at__lt=to_at,
            ).order_by("session_started_at", "id")
        )
        session_ids = [row.id for row in sessions]
        events: dict[UUID, list[EventRecord]] = {
            session_id: [] for session_id in session_ids
        }
        reviews: dict[UUID, SessionReview] = {}

        if session_ids:
            for row in SessionEvent.objects.filter(
                session_id__in=session_ids
            ).order_by("session_id", "occurred_at", "id"):
                events[row.session_id].append(
                    EventRecord(
                        type=row.type,
                        occurred_at=row.occurred_at,
                        segment_index=row.segment_index,
                        payload=dict(row.payload_json),
                    )
                )
            reviews = {
                row.session_id: row
                for row in SessionReview.objects.filter(
                    session_id__in=session_ids
                )
            }

        work_items = {
            row.id: row
            for row in WorkItem.objects.filter(owner_id=self.owner_id)
        }
        work_types = {
            row.id: row
            for row in WorkType.objects.filter(owner_id=self.owner_id)
        }
        work_types.update(
            {
                row.id: row
                for row in WorkType.objects.filter(owner_id__isnull=True)
            }
        )

        preferences = UserPreferences.objects.filter(
            user_id=self.owner_id
        ).first()
        if preferences is None:
            raise TaskillerAPIError(
                500,
                "preferences_missing",
                "User preferences are missing",
            )

        return LoadedHistory(
            sessions=sessions,  # type: ignore[arg-type]
            events=events,
            reviews=reviews,  # type: ignore[arg-type]
            work_items=work_items,  # type: ignore[arg-type]
            work_types=work_types,  # type: ignore[arg-type]
            preferences=preferences,  # type: ignore[arg-type]
        )
