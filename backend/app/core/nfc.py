"""NTAG 424 DNA Secure Dynamic Messaging (SDM / SUN) validation.

Implements the server side of NXP AN12196: on every tap the tag injects
AES-encrypted PICC data (UID + read counter) and a CMAC into the mirrored
URL. This module verifies that cryptographic proof.

Key management: a single AES-128 master key (NFC_MASTER_KEY env var) lives
outside the database. Per-tag keys are diversified from it via AES-CMAC over
a purpose label and the tag UID, so the DB stores only UIDs and counters —
never key material. The same derivation is run offline when programming
tags (see app/nfc_provisioning.py).
"""

import hmac

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.cmac import CMAC

# Key diversification labels (separate keys for separate purposes)
META_READ_KEY_LABEL = b"UB-NFC-META"
FILE_READ_KEY_LABEL = b"UB-NFC-READ"

UID_LENGTH = 7
AES_BLOCK_SIZE = 16
SDM_MAC_LENGTH = 8  # SDMMAC is the CMAC truncated to 8 bytes

# SV2 prefix as defined in AN12196 for SDM read MACing
SV2_PREFIX = bytes([0x3C, 0xC3, 0x00, 0x01, 0x00, 0x80])


class NfcValidationError(Exception):
    """Raised when a tag's cryptographic proof fails validation."""


def aes_cmac(key: bytes, message: bytes) -> bytes:
    c = CMAC(algorithms.AES(key))
    c.update(message)
    return c.finalize()


def derive_key(master_key: bytes, label: bytes, uid: bytes) -> bytes:
    """Diversify the master key into a per-tag key (AES-CMAC KDF)."""
    if len(master_key) != AES_BLOCK_SIZE:
        raise ValueError("Master key must be 16 bytes (AES-128)")
    if len(uid) != UID_LENGTH:
        raise ValueError(f"UID must be {UID_LENGTH} bytes")
    return aes_cmac(master_key, label + uid)


def decrypt_picc_data(
    meta_read_key: bytes, enc_picc_data: bytes
) -> tuple[bytes, bytes]:
    """Decrypt SDM PICC data, returning (uid, read_counter_bytes).

    Plaintext layout (AN12196): 0xC7 || UID[7] || SDMReadCtr[3] || pad[5].
    The read counter is LSB-first and stays in that byte order for SV2.
    """
    if len(enc_picc_data) != AES_BLOCK_SIZE:
        raise NfcValidationError("PICC data must be 16 bytes")
    cipher = Cipher(algorithms.AES(meta_read_key), modes.CBC(bytes(AES_BLOCK_SIZE)))
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(enc_picc_data) + decryptor.finalize()
    if plaintext[0] != 0xC7:
        raise NfcValidationError("Invalid PICC data tag byte")
    uid = plaintext[1 : 1 + UID_LENGTH]
    counter = plaintext[8:11]
    return uid, counter


def truncate_mac(full_mac: bytes) -> bytes:
    """CMAC truncation per AN12196: the odd-numbered bytes of the full MAC."""
    return bytes(full_mac[i] for i in range(1, AES_BLOCK_SIZE, 2))


def compute_sdm_mac(
    file_read_key: bytes,
    uid: bytes,
    counter: bytes,
    enc_file_data: bytes = b"",
    mac_param_name: str = "cmac",
) -> bytes:
    """Compute the expected (truncated) SDMMAC for a tap.

    When SDMEncFileData is mirrored, the MAC input is the literal URL text:
    the uppercase hex characters of the encrypted file data followed by
    "&<mac param>=". With PICC-only mirroring the MAC input is empty.
    """
    sv2 = SV2_PREFIX + uid + counter
    session_mac_key = aes_cmac(file_read_key, sv2)
    mac_input = (
        enc_file_data.hex().upper().encode("ascii")
        + f"&{mac_param_name}=".encode("ascii")
        if enc_file_data
        else b""
    )
    return truncate_mac(aes_cmac(session_mac_key, mac_input))


def validate_sun_message(
    meta_read_key: bytes,
    file_read_key: bytes,
    picc_hex: str,
    cmac_hex: str,
    enc_hex: str | None = None,
) -> tuple[bytes, int]:
    """Validate a SUN message against explicit tag keys.

    Returns (uid, read_counter) on success, raises NfcValidationError on
    any cryptographic failure.
    """
    try:
        enc_picc = bytes.fromhex(picc_hex)
        received_mac = bytes.fromhex(cmac_hex)
        enc_file_data = bytes.fromhex(enc_hex) if enc_hex else b""
    except ValueError:
        raise NfcValidationError("Malformed hex parameters")

    uid, counter = decrypt_picc_data(meta_read_key, enc_picc)
    expected_mac = compute_sdm_mac(file_read_key, uid, counter, enc_file_data)
    if not hmac.compare_digest(expected_mac, received_mac):
        raise NfcValidationError("SDMMAC mismatch")
    return uid, int.from_bytes(counter, "little")


def validate_tag(
    master_key: bytes,
    uid_hex: str,
    picc_hex: str,
    cmac_hex: str,
    enc_hex: str | None = None,
) -> int:
    """Validate a tap for a known tag UID using master-key diversification.

    The UID is passed in plaintext in the tag URL (written at programming
    time) so the per-tag keys can be derived; the decrypted PICC UID must
    match it, which proves the tap came from the genuine tag.

    Returns the tag read counter on success.
    """
    try:
        uid = bytes.fromhex(uid_hex)
    except ValueError:
        raise NfcValidationError("Malformed UID")
    if len(uid) != UID_LENGTH:
        raise NfcValidationError("UID must be 7 bytes")

    meta_read_key = derive_key(master_key, META_READ_KEY_LABEL, uid)
    file_read_key = derive_key(master_key, FILE_READ_KEY_LABEL, uid)
    picc_uid, counter = validate_sun_message(
        meta_read_key, file_read_key, picc_hex, cmac_hex, enc_hex
    )
    if not hmac.compare_digest(picc_uid, uid):
        raise NfcValidationError("Decrypted UID does not match URL UID")
    return counter


def encrypt_picc_data(meta_read_key: bytes, uid: bytes, counter: int) -> bytes:
    """Encrypt PICC data as a tag would. Used for provisioning tests/simulation."""
    plaintext = bytes([0xC7]) + uid + counter.to_bytes(3, "little") + bytes(5)
    cipher = Cipher(algorithms.AES(meta_read_key), modes.CBC(bytes(AES_BLOCK_SIZE)))
    encryptor = cipher.encryptor()
    return encryptor.update(plaintext) + encryptor.finalize()
