"""Tests for NTAG 424 DNA SDM validation (app/core/nfc.py).

Vectors are the reference examples from NXP AN12196 / sdm.nfcdeveloper.com
using factory (all-zero) keys.
"""

import pytest

from app.core.nfc import (
    FILE_READ_KEY_LABEL,
    META_READ_KEY_LABEL,
    NfcValidationError,
    compute_sdm_mac,
    decrypt_picc_data,
    derive_key,
    encrypt_picc_data,
    validate_sun_message,
    validate_tag,
)

ZERO_KEY = bytes(16)


# NXP reference vector: PICC data mirroring only (no file data)
def test_picc_only_vector() -> None:
    uid, counter = validate_sun_message(
        ZERO_KEY,
        ZERO_KEY,
        "EF963FF7828658A599F3041510671E88",
        "94EED9EE65337086",
    )
    assert uid.hex() == "04de5f1eacc040"
    assert counter == 61


# NXP reference vector: PICC data + SDMEncFileData mirroring
def test_picc_and_enc_file_data_vector() -> None:
    uid, counter = validate_sun_message(
        ZERO_KEY,
        ZERO_KEY,
        "FD91EC264309878BE6345CBE53BADF40",
        "ECC1E7F6C6C73BF6",
        "CEE9A53E3E463EF1F459635736738962",
    )
    assert uid.hex() == "04958caa5c5e80"
    assert counter == 8


def test_decrypt_picc_data_layout() -> None:
    uid, counter_bytes = decrypt_picc_data(
        ZERO_KEY, bytes.fromhex("EF963FF7828658A599F3041510671E88")
    )
    assert uid.hex() == "04de5f1eacc040"
    assert counter_bytes == bytes.fromhex("3d0000")  # LSB-first


def test_mac_truncation_uses_odd_bytes() -> None:
    # full CMAC 00112233445566778899AABBCCDDEEFF -> 1133557799BBDDFF
    full = bytes.fromhex("00112233445566778899aabbccddeeff")
    from app.core.nfc import truncate_mac

    assert truncate_mac(full).hex() == "1133557799bbddff"


def test_wrong_cmac_rejected() -> None:
    with pytest.raises(NfcValidationError):
        validate_sun_message(
            ZERO_KEY,
            ZERO_KEY,
            "EF963FF7828658A599F3041510671E88",
            "0000000000000000",
        )


def test_malformed_hex_rejected() -> None:
    with pytest.raises(NfcValidationError):
        validate_sun_message(ZERO_KEY, ZERO_KEY, "not-hex", "94EED9EE65337086")


def test_derive_key_roundtrip() -> None:
    master = bytes(range(16))
    uid = bytes.fromhex("04A1B2C3D4E5F6")
    meta_key = derive_key(master, META_READ_KEY_LABEL, uid)
    file_key = derive_key(master, FILE_READ_KEY_LABEL, uid)
    assert len(meta_key) == 16
    assert meta_key != file_key  # purpose separation
    # Deterministic
    assert derive_key(master, META_READ_KEY_LABEL, uid) == meta_key
    # Different UID -> different keys
    assert (
        derive_key(master, META_READ_KEY_LABEL, bytes.fromhex("04A1B2C3D4E5F7"))
        != meta_key
    )


def _simulate_tap(master: bytes, uid_hex: str, counter: int) -> dict[str, str]:
    """Generate picc/cmac params exactly as a genuine tag would."""
    uid = bytes.fromhex(uid_hex)
    meta_key = derive_key(master, META_READ_KEY_LABEL, uid)
    file_key = derive_key(master, FILE_READ_KEY_LABEL, uid)
    picc = encrypt_picc_data(meta_key, uid, counter)
    cmac = compute_sdm_mac(file_key, uid, counter.to_bytes(3, "little"))
    return {"picc": picc.hex().upper(), "cmac": cmac.hex().upper()}


def test_validate_tag_roundtrip() -> None:
    master = bytes(range(16))
    uid_hex = "04A1B2C3D4E5F6"
    tap = _simulate_tap(master, uid_hex, counter=42)
    assert validate_tag(master, uid_hex, tap["picc"], tap["cmac"]) == 42


def test_validate_tag_uid_mismatch_rejected() -> None:
    """PICC data from one tag must not validate against another tag's URL."""
    master = bytes(range(16))
    tap = _simulate_tap(master, "04A1B2C3D4E5F6", counter=1)
    with pytest.raises(NfcValidationError):
        validate_tag(master, "04A1B2C3D4E5F7", tap["picc"], tap["cmac"])


def test_validate_tag_wrong_master_key_rejected() -> None:
    master = bytes(range(16))
    other_master = bytes(reversed(range(16)))
    tap = _simulate_tap(master, "04A1B2C3D4E5F6", counter=1)
    with pytest.raises(NfcValidationError):
        validate_tag(other_master, "04A1B2C3D4E5F6", tap["picc"], tap["cmac"])
