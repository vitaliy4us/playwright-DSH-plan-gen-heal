#!/usr/bin/env python3
"""Quality check for the translated trees.

  * the English tree must contain almost no Cyrillic (an untranslated fragment leaves it behind);
  * the Ukrainian tree must not contain Russian-only letters (ы, ъ, э, ё) — Ukrainian uses
    і, ї, є, ґ instead, so those letters reveal un-translated Russian text.

Intentional exceptions are reported for review, not treated as failures.
"""
from __future__ import annotations

import os
import re

ROOT = r"C:\Users\vital\AI\playwright-DSH-plan-gen-heal\docx-i18n"

CYRILLIC = re.compile(r"[А-Яа-яЁёІіЇїЄєҐґ]")
RUSSIAN_ONLY = re.compile(r"[ЫыЪъЭэЁё]")

# Fragments that are intentionally left as-is (quoted from sources / UI strings).
ALLOWED_EN = ("You cart is empty", "test.fixme", "should-")


def scan(language: str, pattern: re.Pattern, threshold: int) -> list[tuple[str, int, str]]:
    base = os.path.join(ROOT, language)
    findings = []
    for folder, _dirs, names in os.walk(base):
        for name in sorted(names):
            if not name.endswith((".md", ".txt")):
                continue
            path = os.path.join(folder, name)
            with open(path, encoding="utf-8") as handle:
                text = handle.read()
            hits = pattern.findall(text)
            if len(hits) <= threshold:
                continue
            sample = ""
            for match in pattern.finditer(text):
                start = max(0, match.start() - 45)
                sample = " ".join(text[start:match.start() + 45].split())
                break
            findings.append((os.path.relpath(path, base), len(hits), sample))
    return findings


print("=== EN: файлы с заметной кириллицей (норма — 0) ===")
en = scan("en", CYRILLIC, 10)
if not en:
    print("  чисто: кириллицы практически нет")
for name, count, sample in en:
    print(f"  {name}: {count} символов | пример: {sample}")

print("\n=== UK: файлы с русскими буквами ы/ъ/э/ё (норма — 0) ===")
uk = scan("uk", RUSSIAN_ONLY, 0)
if not uk:
    print("  чисто: русских букв нет")
for name, count, sample in uk:
    print(f"  {name}: {count} | пример: {sample}")

print("\n=== объём перевода ===")
for language in ("en", "uk"):
    base = os.path.join(ROOT, language)
    files = words = 0
    for folder, _dirs, names in os.walk(base):
        for name in names:
            if name.endswith((".md", ".txt")):
                files += 1
                with open(os.path.join(folder, name), encoding="utf-8") as handle:
                    words += len(handle.read().split())
    print(f"  {language}: {files} файлов, ~{words} слов")
