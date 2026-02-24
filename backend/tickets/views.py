from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Q, Count
from django.db.models.functions import TruncDate
from .models import Ticket
from .serializers import TicketSerializer
from .llm import classify_ticket

@api_view(['GET'])
def healthcheck(_):
    return Response({'status': 'ok'})

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('category'):
            qs = qs.filter(category=p['category'])
        if p.get('priority'):
            qs = qs.filter(priority=p['priority'])
        if p.get('status'):
            qs = qs.filter(status=p['status'])
        if p.get('search'):
            qs = qs.filter(
                Q(title__icontains=p['search']) | 
                Q(description__icontains=p['search'])
            )
        return qs
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = Ticket.objects.all()
        total = qs.count()
        open_count = qs.filter(status='open').count()

        daily = (qs.annotate(day=TruncDate('created_at'))).values('day').annotate(cnt=Count('id'))    

        avg_per_day = round(
            sum(d['cnt'] for d in daily) /len(daily) if daily else 0, 1
        )    

        priority_breakdown = {
            p: qs.filter(priority=p).count() for p in ['low', 'medium', 'high', 'critical']
        }   

        category_breakdown = {
            c: qs.filter(category=c).count() for c in ['billing', 'technical', 'account', 'general']
        }

        return Response({
            'total_tickets': total,
            'open_tickets': open_count,
            'avg_tickets_per_day': avg_per_day,
            'priority_breakdown': priority_breakdown,
            'category_breakdown': category_breakdown
        })    

    @action(detail=False, methods=['post'])
    def classify(self, request):
        description = request.data.get('description', '')
        if not description:
            return Response({'error': 'description required'}, status=status.HTTP_400_BAD_REQUEST)
        result = classify_ticket(description)
        if result:
            return Response({
                'suggested_category': result['category'],
                'suggested_priority': result['priority']
            })
        return Response({'error': 'classification unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
