#!/usr/bin/env python3
"""Encode a 90s 128kbps preview clip (Club Copy on-site listening format)."""
import hashlib
import math
import os
import struct
import subprocess
import sys
import tempfile

SR = 44100
SECONDS = 90
BPM = 122


def seed_from(name):
    h = hashlib.sha1(name.encode("utf-8")).digest()
    return int.from_bytes(h[:8], "big")


def clamp(n):
    if n > 32767:
        return 32767
    if n < -32768:
        return -32768
    return int(n)


def noise(rng):
    rng[0] = (1103515245 * rng[0] + 12345) & 0x7FFFFFFF
    return (rng[0] / 0x7FFFFFFF) * 2.0 - 1.0


def render(seed):
    rng = [seed & 0x7FFFFFFF or 1]
    n = SR * SECONDS
    spb = int(SR * 60.0 / BPM)
    root = 90.0 + (seed % 40)
    samples = bytearray()
    kick_phase = 0.0
    bass_phase = 0.0
    for i in range(n):
        t = i / SR
        pos = i % spb
        beat = (i // spb) % 8
        env_k = math.exp(-pos / (SR * 0.045))
        kick_hz = 62.0 + 80.0 * env_k
        kick_phase += 2 * math.pi * kick_hz / SR
        kick = math.sin(kick_phase) * env_k * (0.86 if beat % 2 == 0 else 0.62)

        hat = 0.0
        if pos < SR * 0.018 and beat not in (0, 4):
            hat = noise(rng) * math.exp(-pos / (SR * 0.012)) * 0.12
        elif pos < SR * 0.012:
            hat = noise(rng) * math.exp(-pos / (SR * 0.008)) * 0.08

        bar = (i // (spb * 4))
        deg = [0, 7, 3, 10][bar % 4]
        bass_hz = root * (2 ** (deg / 12.0))
        if beat in (1, 3, 6):
            bass_hz *= 0.75
        bass_phase += 2 * math.pi * bass_hz / SR
        bass_env = 0.55 if pos < spb * 0.55 else 0.18
        bass = math.sin(bass_phase) * bass_env * 0.28
        bass += math.sin(bass_phase * 2) * bass_env * 0.06

        tape = math.sin(2 * math.pi * 0.15 * t) * 0.04
        s = kick + hat + bass + tape * noise(rng) * 0.08
        s *= 0.92
        v = clamp(s * 22000)
        samples += struct.pack("<hh", v, v)
    return bytes(samples)


def encode(path, pcm):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    try:
        wav.write(b"RIFF")
        wav.write(struct.pack("<I", 36 + len(pcm)))
        wav.write(b"WAVEfmt ")
        wav.write(struct.pack("<IHHIIHH", 16, 1, 2, SR, SR * 4, 4, 16))
        wav.write(b"data")
        wav.write(struct.pack("<I", len(pcm)))
        wav.write(pcm)
        wav.close()
        subprocess.check_call(
            [
                "ffmpeg",
                "-y",
                "-i",
                wav.name,
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "128k",
                "-ar",
                "44100",
                "-ac",
                "2",
                path,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    finally:
        try:
            os.unlink(wav.name)
        except OSError:
            pass


def main():
    if len(sys.argv) < 2:
        print("usage: make-preview-clip.py <out.mp3> [seed-name]")
        sys.exit(1)
    out = sys.argv[1]
    name = sys.argv[2] if len(sys.argv) > 2 else out
    encode(out, render(seed_from(name)))
    print(out)


if __name__ == "__main__":
    main()
