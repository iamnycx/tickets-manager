from django.urls import path, include
from tickets.views import healthcheck

urlpatterns = [
    path('api/', include('tickets.urls')),
    path('api/health/', healthcheck, name='healthcheck'),
]
