"""Construye content/es/fragments/*.json a partir de src/*.txt.

Formato de fuente:
  # slot            -> cambia de slot
  texto             -> fragmento sin condiciones
  @{json} texto     -> fragmento con when
  !N texto          -> peso N (combinable: !2 @{...} texto)
  // comentario
"""
import json, re, sys, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = r"C:\Users\alvar\Documents\tarotazo\arcana\content\es\fragments"
SLOTS = {"entrada", "puente", "personalizacion", "guino", "cambioHumor", "sintesis", "saludo", "despedida", "salud"}
TONES = ["mistica", "abuela", "teletienda", "ironica", "dramatica", "coach"]
VARS = set("provincia comunidad gentilicio plato fiesta clima signo decada numeroVida tema carta palo posicion cartaAnterior hora diaSemana estacion faseLunar tono nombre inicial edad".split())
WHEN = {"tema", "invertida", "arcana", "cardIds", "suit", "posicion", "decadaMin", "decadaMax", "horaMin", "horaMax",
        "mayoresMin", "provincia", "signo", "diaSemana", "faseLunar", "primeraCarta", "ultimaCarta", "suitDominante", "figurasMin", "estacion", "family", "spread"}
LISTS = {"estacion", "family", "spread", "tema", "cardIds", "suit", "posicion", "provincia", "signo", "diaSemana", "faseLunar"}

errors = []
total = collections.Counter()

def check_text(t, where):
    for v in re.findall(r"\{([^}]*)\}", t):
        if v not in VARS:
            errors.append(f"{where}: variable desconocida {{{v}}}")
    depth = 0
    for ch in t:
        if ch == "[":
            depth += 1
            if depth > 1: errors.append(f"{where}: corchetes anidados")
        elif ch == "]":
            depth -= 1
    if depth != 0:
        errors.append(f"{where}: corchetes desequilibrados")
    if re.search(r"\[[^\]]*\]", t) and any("|" not in m for m in re.findall(r"\[([^\]]*)\]", t)):
        errors.append(f"{where}: [..] sin alternativas")
    if re.search(r"\d{6,}", t):
        errors.append(f"{where}: posible número de teléfono")

for fn in sorted(os.listdir(os.path.join(HERE, "src"))):
    if not fn.endswith(".txt"): continue
    tone = fn[:-4]
    slot = None
    frags = []
    counters = collections.Counter()
    for ln, raw in enumerate(open(os.path.join(HERE, "src", fn), encoding="utf-8"), 1):
        line = raw.strip()
        if not line or line.startswith("//"): continue
        if line.startswith("# "):
            slot = line[2:].strip()
            if slot not in SLOTS: errors.append(f"{fn}:{ln} slot {slot}")
            continue
        where = f"{fn}:{ln}"
        weight = 1
        when = None
        m = re.match(r"!(\d+)\s+", line)
        if m:
            weight = int(m.group(1)); line = line[m.end():]
        if line.startswith("@{"):
            dec = json.JSONDecoder()
            try:
                when, end = dec.raw_decode(line[1:])
            except Exception as e:
                errors.append(f"{where}: when inválido {e}"); continue
            line = line[1 + end:].strip()
            for k, v in when.items():
                if k not in WHEN: errors.append(f"{where}: clave when {k}")
                if k in LISTS and not isinstance(v, list): errors.append(f"{where}: {k} debe ser lista")
            if "cartaAnterior" in line and when.get("primeraCarta") is not False:
                errors.append(f"{where}: cartaAnterior sin primeraCarta:false")
        elif "{cartaAnterior}" in line:
            errors.append(f"{where}: cartaAnterior sin primeraCarta:false")
        check_text(line, where)
        counters[slot] += 1
        fid = f"{slot}.{tone}.{counters[slot]:03d}"
        f = {"id": fid, "slot": slot}
        if tone != "comun": f["tones"] = [tone]
        if weight != 1: f["weight"] = weight
        if when: f["when"] = when
        f["text"] = line
        frags.append(f)
        total[(slot, tone)] += 1
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, f"{tone}.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump({"fragments": frags}, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

texts = collections.Counter()
for fn in os.listdir(OUT):
    for f in json.load(open(os.path.join(OUT, fn), encoding="utf-8"))["fragments"]:
        texts[f["text"]] += 1
for t, c in texts.items():
    if c > 1: errors.append(f"texto duplicado: {t[:60]}")

slots = sorted({s for s, _ in total})
tones = sorted({t for _, t in total})
print("slot".ljust(16) + "".join(t[:10].rjust(11) for t in tones) + "      total")
for s in slots:
    print(s.ljust(16) + "".join(str(total[(s, t)]).rjust(11) for t in tones) + str(sum(total[(s, t)] for t in tones)).rjust(11))
print("TOTAL", sum(total.values()))
for e in errors: print("ERROR", e)
sys.exit(1 if errors else 0)
