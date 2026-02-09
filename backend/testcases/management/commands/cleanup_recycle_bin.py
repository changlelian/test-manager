from django.core.management.base import BaseCommand
from django.utils import timezone
from testcases.models import TestCase

class Command(BaseCommand):
    help = 'Permanently delete test cases that have been in the recycle bin for more than 30 days.'

    def handle(self, *args, **options):
        # 30 days ago
        threshold = timezone.now() - timezone.timedelta(days=30)
        
        # Filter items deleted before threshold
        qs = TestCase.objects.filter(is_deleted=True, deleted_at__lt=threshold)
        count = qs.count()
        
        if count > 0:
            qs.delete()
            self.stdout.write(self.style.SUCCESS(f'Successfully deleted {count} old test cases.'))
        else:
            self.stdout.write(self.style.SUCCESS('No old test cases to delete.'))
