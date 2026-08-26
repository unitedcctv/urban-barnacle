"""Provisioning helper for NTAG 424 DNA tags.

Derives the per-tag keys from the master key and prints everything needed
to program a physical tag. Run on an offline/trusted machine — the output
contains secret key material.

Usage:
    uv run python -m app.nfc_provisioning <UID_HEX>

The tag UID (7 bytes) can be read with any NFC reader app before
programming. Requires NFC_MASTER_KEY to be set (32 hex chars).
"""

import sys

from app.core.config import settings
from app.core.nfc import (
    FILE_READ_KEY_LABEL,
    META_READ_KEY_LABEL,
    UID_LENGTH,
    derive_key,
)

# SDM placeholder values recognised by NXP TagWriter when writing the URL
PICC_PLACEHOLDER = "0" * 32  # 16 bytes, replaced by the "PICC Data" placeholder
CMAC_PLACEHOLDER = "0" * 16  # 8 bytes, replaced by the "SDMMAC" placeholder


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    uid_hex = sys.argv[1].upper()
    if not settings.NFC_MASTER_KEY:
        print("Error: NFC_MASTER_KEY is not set (32 hex chars expected in .env)")
        sys.exit(1)

    try:
        uid = bytes.fromhex(uid_hex)
    except ValueError:
        print(f"Error: '{uid_hex}' is not valid hex")
        sys.exit(1)
    if len(uid) != UID_LENGTH:
        print(f"Error: UID must be {UID_LENGTH} bytes ({UID_LENGTH * 2} hex chars)")
        sys.exit(1)

    master_key = bytes.fromhex(settings.NFC_MASTER_KEY)
    meta_read_key = derive_key(master_key, META_READ_KEY_LABEL, uid)
    file_read_key = derive_key(master_key, FILE_READ_KEY_LABEL, uid)

    url = (
        f"{settings.BACKEND_HOST}{settings.API_V1_STR}/nfc/verify"
        f"?uid={uid_hex}&picc={PICC_PLACEHOLDER}&cmac={CMAC_PLACEHOLDER}"
    )

    print(f"Tag UID:          {uid_hex}")
    print()
    print("Keys to write to the tag (keep secret!):")
    print(f"  Key 1 (SDM Meta Read key): {meta_read_key.hex().upper()}")
    print(f"  Key 2 (SDM File Read key): {file_read_key.hex().upper()}")
    print()
    print("URL to write to the tag (NDEF record):")
    print(f"  {url}")
    print()
    print("Programming notes:")
    print("  - In NXP TagWriter, when adding the URL, replace the 32 zero")
    print("    chars after 'picc=' with the 'PICC Data' SDM placeholder and")
    print("    the 16 zero chars after 'cmac=' with the 'SDMMAC' placeholder.")
    print("  - Enable SDM with PICC data mirroring (no file data mirroring).")
    print("  - The hex in the URL must stay uppercase on the tag.")
    print("  - Register the tag in the app (POST /api/v1/nfc/tags) so taps")
    print("    resolve to the right item.")


if __name__ == "__main__":
    main()
