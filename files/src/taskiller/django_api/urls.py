from django.urls import path

from taskiller.django_api import views

urlpatterns = [
    path("api/v1/auth/register", views.RegisterView.as_view()),
    path("api/v1/auth/login", views.LoginView.as_view()),
    path("api/v1/auth/refresh", views.RefreshView.as_view()),
    path("api/v1/auth/logout", views.LogoutView.as_view()),
    path("api/v1/auth/logout-all", views.LogoutAllView.as_view()),
    path("api/v1/auth/sessions", views.SessionsView.as_view()),
    path(
        "api/v1/auth/sessions/<uuid:sessionId>",
        views.SessionDetailView.as_view(),
    ),
    path(
        "api/v1/auth/email-verification/request",
        views.RequestEmailVerificationView.as_view(),
    ),
    path(
        "api/v1/auth/email-verification/confirm",
        views.ConfirmEmailVerificationView.as_view(),
    ),
    path(
        "api/v1/auth/password-reset/request",
        views.RequestPasswordResetView.as_view(),
    ),
    path(
        "api/v1/auth/password-reset/confirm",
        views.ConfirmPasswordResetView.as_view(),
    ),
    path("api/v1/me", views.MeView.as_view()),
    path("api/v1/me/preferences", views.PreferencesView.as_view()),
    path(
        "api/v1/me/export-requests",
        views.ExportRequestCreateView.as_view(),
    ),
    path(
        "api/v1/me/export-requests/<uuid:exportRequestId>",
        views.ExportRequestDetailView.as_view(),
    ),
    path(
        "api/v1/exports/<uuid:exportRequestId>/download",
        views.ExportDownloadView.as_view(),
    ),
]
