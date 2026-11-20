import json, os, importlib.util
here=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('p', os.path.join(here,'provs.py')); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
root='C:/Users/alvar/Documents/tarotazo/arcana/content'
base={p['code']:p for p in json.load(open(root+'/provinces.json',encoding='utf-8'))['provinces']}
os.makedirs(root+'/es/provinces',exist_ok=True)
assert set(base)==set(m.P), set(base)^set(m.P)
for code,(g,pl,fi,cl,ch) in m.P.items():
    b=base[code]
    assert 2<=len(pl)<=4 and 2<=len(fi)<=4 and 2<=len(cl)<=4 and len(ch)>=6, code
    d={"code":code,"nombre":b['nombre'],"comunidad":b['comunidad'] or "el ancho mundo","gentilicio":g,"plato":pl,"fiesta":fi,"clima":cl,"chascarrillos":ch}
    open(f'{root}/es/provinces/{code}.json','w',encoding='utf-8',newline='\n').write(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(len(m.P), sum(len(v[4]) for v in m.P.values()))
