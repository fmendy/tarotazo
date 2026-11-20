import json, sys, importlib.util, os
here=os.path.dirname(os.path.abspath(__file__))
def load(n):
    spec=importlib.util.spec_from_file_location(n, os.path.join(here,n+'.py')); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
maj=load('t_major').M
def L(x): return x if isinstance(x,list) else [x]
def conv(t):
    g1,g2,a,tr,d,s=t
    return {"general":[g1,g2] if not isinstance(g1,list) else g1+L(g2),"amor":L(a),"trabajo":L(tr),"dinero":L(d),"salud":L(s)}
out={}
for k in sorted(maj): out[k]=maj[k]
order=['01','02','03','04','05','06','07','08','09','10','sota','caballo','reina','rey']
mins={}
for n in ('t_minor1','t_minor2'): mins.update(load(n).N)
for suit in ('bastos','copas','espadas','oros'):
    for r in order:
        kw,up,rev=mins[f'{suit}-{r}']
        out[f'{suit}-{r}']={"keywords":kw,"upright":conv(up),"reversed":conv(rev)}
assert len(out)==78, len(out)
dst=sys.argv[1]
os.makedirs(os.path.dirname(dst),exist_ok=True)
open(dst,'w',encoding='utf-8',newline='\n').write(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('ok',len(out))
