"""Shared file storage under /data/shared for browser file uploads.

Files dropped via the Manager UI land in the shared directory on the
same Docker volume as profile data. Browsers inside the container can
open files from that path (e.g. /data/shared/invoice.pdf) when a site
shows a file picker.
"""

from __future__ import annotations

import datetime
import re
from pathlib import Path

from . import database as db

# Reject empty names, path separators, traversal, and Windows-reserved chars.
_SAFE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._()\[\] {}@+-]*$")
_MAX_NAME_LEN = 255
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


def shared_dir() -> Path:
    """Return the shared files directory (follows DATA_DIR for tests)."""
    return db.DATA_DIR / "shared"


def ensure_shared_dir() -> Path:
    path = shared_dir()
    path.mkdir(parents=True, exist_ok=True)
    return path


def _validate_name(name: str) -> str:
    """Return a safe basename or raise ValueError."""
    if not name or not name.strip():
        raise ValueError("Filename is required")
    # Strip any directory components the client may have sent
    name = Path(name).name.strip()
    if not name or name in (".", ".."):
        raise ValueError("Invalid filename")
    if len(name) > _MAX_NAME_LEN:
        raise ValueError("Filename too long")
    if "/" in name or "\\" in name or "\x00" in name:
        raise ValueError("Invalid filename")
    if not _SAFE_NAME.match(name):
        raise ValueError(
            "Filename contains invalid characters. "
            "Use letters, numbers, spaces, and ._-()[]{}@+"
        )
    return name


def resolve_path(name: str) -> Path:
    """Resolve a filename to an absolute path inside the shared directory.

    Raises ValueError if the name is unsafe or escapes the shared directory.
    """
    root = ensure_shared_dir()
    safe = _validate_name(name)
    path = (root / safe).resolve()
    shared_root = root.resolve()
    if path != shared_root and shared_root not in path.parents:
        raise ValueError("Invalid filename")
    return path


def list_files() -> list[dict]:
    root = ensure_shared_dir()
    files: list[dict] = []
    for entry in sorted(root.iterdir(), key=lambda p: p.name.lower()):
        if not entry.is_file():
            continue
        try:
            _validate_name(entry.name)
        except ValueError:
            continue
        stat = entry.stat()
        mtime = datetime.datetime.fromtimestamp(
            stat.st_mtime, tz=datetime.timezone.utc
        ).isoformat()
        files.append(
            {
                "name": entry.name,
                "size": stat.st_size,
                "modified_at": mtime,
                "path": str(root / entry.name),
            }
        )
    return files


def save_file(name: str, data: bytes, *, overwrite: bool = False) -> dict:
    if len(data) > MAX_FILE_SIZE:
        raise ValueError(f"File exceeds maximum size of {MAX_FILE_SIZE} bytes")
    path = resolve_path(name)
    root = shared_dir()
    if path.exists() and not overwrite:
        raise FileExistsError(f"File already exists: {path.name}")
    path.write_bytes(data)
    stat = path.stat()
    mtime = datetime.datetime.fromtimestamp(
        stat.st_mtime, tz=datetime.timezone.utc
    ).isoformat()
    return {
        "name": path.name,
        "size": stat.st_size,
        "modified_at": mtime,
        "path": str(root / path.name),
    }


def delete_file(name: str) -> None:
    path = resolve_path(name)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {name}")
    path.unlink()
