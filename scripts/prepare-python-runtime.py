"""Prepare the pinned Windows Python and ESP32 assets used by electron-builder."""
from hashlib import sha256
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from urllib.request import urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "scripts" / "python-runtime-requirements.txt"
OUTPUT = ROOT / ".toolchain" / "python"
PYTHON = (
    "https://www.python.org/ftp/python/3.14.9/python-3.14.9-embed-amd64.zip",
    "3c01d7cfc666f746a6f064f60fb2156ab0ec464d3d738ab796371a46a9bb24a2",
)
FIRMWARE = (
    "https://micropython.org/resources/firmware/ESP32_GENERIC-20251209-v1.27.0.bin",
    "aa4be80ec695911ba0f13f7558e559ce540f90efbf40c23b853ca49162136b9f",
)
MICROPYTHON_LICENSE = (
    "https://raw.githubusercontent.com/micropython/micropython/v1.27.0/LICENSE",
    "419137268636eb7d29b83c68e4f5f4494bcb172c24b18a122eb46312c4966940",
)


def fetch(source, path):
    url, expected = source
    with urlopen(url, timeout=60) as response, path.open("wb") as file:
        shutil.copyfileobj(response, file)
    if sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f"Checksum mismatch for {url}")


def verify(bundle):
    firmware = bundle / "ESP32_GENERIC.bin"
    if sha256(firmware.read_bytes()).hexdigest() != FIRMWARE[1]:
        raise ValueError("MicroPython firmware checksum mismatch")
    subprocess.run(
        [str(bundle / "python.exe"), "-I", "-c",
         "import esptool, mpremote, serial; print('Embedded Python and ESP32 tools ready')"],
        cwd=bundle, check=True,
    )


def main():
    if sys.platform != "win32" or sys.version_info[:2] != (3, 14):
        raise SystemExit("Use Windows x64 Python 3.14 with pip to prepare the installer.")
    fingerprint = sha256(Path(__file__).read_bytes() + LOCK.read_bytes()).hexdigest()
    marker = OUTPUT / "bundle.sha256"
    if marker.is_file() and marker.read_text(encoding="ascii") == fingerprint:
        verify(OUTPUT)
        return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT.parent.resolve() != OUTPUT.parent or OUTPUT.is_symlink() or OUTPUT.is_junction():
        raise ValueError("The bundle destination must be inside the local .toolchain directory")
    with tempfile.TemporaryDirectory(prefix="python-bundle-", dir=OUTPUT.parent) as temp:
        staging = Path(temp) / "bundle"
        staging.mkdir()
        archive = Path(temp) / "python.zip"
        fetch(PYTHON, archive)
        with ZipFile(archive) as python_zip:
            python_zip.extractall(staging)
        with (staging / "python314._pth").open("a", encoding="ascii") as paths:
            paths.write("\npackages\n")
        fetch(FIRMWARE, staging / "ESP32_GENERIC.bin")
        fetch(MICROPYTHON_LICENSE, staging / "MICROPYTHON-LICENSE.txt")
        subprocess.run([sys.executable, "-m", "pip", "install", "--require-hashes",
                        "--no-deps", "--target", str(staging / "packages"), "-r", str(LOCK)], check=True)
        # Include the exact corresponding upstream source for the GPL esptool package.
        esptool = next(line for line in LOCK.read_text(encoding="utf-8").splitlines() if line.startswith("esptool @ "))
        esptool_url, esptool_hash = esptool.removeprefix("esptool @ ").split(" --hash=sha256:")
        fetch((esptool_url, esptool_hash), staging / "esptool-5.1.0-source.tar.gz")
        verify(staging)
        (staging / marker.name).write_text(fingerprint, encoding="ascii")
        previous = Path(temp) / "previous"
        if OUTPUT.exists():
            OUTPUT.rename(previous)
        try:
            staging.rename(OUTPUT)
        except OSError:
            if previous.exists():
                previous.rename(OUTPUT)
            raise


if __name__ == "__main__":
    main()
