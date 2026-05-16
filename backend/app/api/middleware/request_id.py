"""X-Request-ID middleware — generates or propagates a unique request ID.

Adds ``X-Request-ID`` to every response.  If the client sends an
``X-Request-ID`` header, it is preserved; otherwise a new UUID is generated.
"""

from __future__ import annotations

from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid4()))
        response = await call_next(request)
        MutableHeaders(response.headers)["X-Request-ID"] = request_id
        return response
