
import traceback
import sys

class DebugExceptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        with open('backend_exception.log', 'a') as f:
            f.write(f"Exception processing request {request.method} {request.path}:\n")
            f.write(str(exception) + "\n")
            traceback.print_exc(file=f)
            f.write("-" * 60 + "\n")
        return None
