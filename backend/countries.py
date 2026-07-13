"""ISO 3166-1 alpha-2 country codes used for profile organization."""

from __future__ import annotations

# Subset of common countries — enough for organization without a huge enum.
# Stored values are always the 2-letter code (uppercase).
COUNTRY_CODES: frozenset[str] = frozenset({
    "US", "CA", "MX", "BR", "AR", "CL", "CO", "PE",
    "GB", "IE", "FR", "DE", "ES", "IT", "PT", "NL", "BE", "CH", "AT",
    "SE", "NO", "DK", "FI", "PL", "CZ", "RO", "HU", "GR", "TR",
    "UA", "RU",
    "AU", "NZ", "JP", "KR", "CN", "TW", "HK", "SG", "MY", "TH",
    "ID", "PH", "VN", "IN", "PK", "BD",
    "AE", "SA", "IL", "EG", "ZA", "NG", "KE",
})


def normalize_country(value: str | None) -> str | None:
    """Normalize a country value to an uppercase ISO code, or None.

    Raises ValueError for unrecognized non-empty values.
    """
    if value is None:
        return None
    code = value.strip().upper()
    if not code:
        return None
    if code not in COUNTRY_CODES:
        raise ValueError(f"Unsupported country code: {value}")
    return code
