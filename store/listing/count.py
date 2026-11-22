"""Cuenta los caracteres de cada campo de es-ES.md y actualiza las marcas de recuento.

Uso: python store/listing/count.py   (idempotente; sale con código 1 si algún campo supera su límite)
"""
import re, sys, pathlib

LIMITS = {"titulo": 30, "breve": 80, "completa": 4000, "notas": 500}
p = pathlib.Path(__file__).with_name("es-ES.md")
s = p.read_text(encoding="utf-8")
fields = dict(re.findall(r"<!-- field:(\w+) -->\n```text\n(.*?)\n```", s, flags=re.S))
bad = False
for name, text in fields.items():
    n = len(text)
    lim = LIMITS.get(name, 40 if name.startswith("captura") else None)
    flag = "" if lim is None or n <= lim else "  <-- SUPERA EL LÍMITE"
    bad |= bool(flag)
    print(f"{name:10} {n:5} / {lim}{flag}")
    s = re.sub(r"\[(?:@count:%s|\d+ caracteres\]<!-- count:%s -->)" % (name, name) + r"(?:\])?",
               f"[{n} caracteres]<!-- count:{name} -->", s)
p.write_text(s, encoding="utf-8", newline="\n")
sys.exit(1 if bad else 0)
