from sqlalchemy import TypeDecorator, Text
import json
try:
    from pgvector.sqlalchemy import Vector as PGVector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    PGVector = None

def get_vector_column(dimension: int = 384):
    """
    Returns pgvector Vector column type for PostgreSQL, 
    with transparent JSON/Text serialization fallback for SQLite/test environments.
    """
    if HAS_PGVECTOR:
        return PGVector(dimension)
    
    class FallbackVector(TypeDecorator):
        impl = Text
        cache_ok = True

        def process_bind_param(self, value, dialect):
            if value is not None:
                if isinstance(value, list):
                    return json.dumps(value)
                return str(value)
            return value

        def process_result_value(self, value, dialect):
            if value is not None:
                try:
                    return json.loads(value)
                except Exception:
                    return value
            return value

    return FallbackVector()
