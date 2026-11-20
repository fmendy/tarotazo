import json, sys, importlib.util, os
here=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('s', os.path.join(here,'s_cards.py')); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
def L(x): return x if isinstance(x,list) else [x]
def conv(t):
    g1,g2,a,tr,d,s=t
    return {"general":[g1,g2],"amor":L(a),"trabajo":L(tr),"dinero":L(d),"salud":L(s)}
out={}
for suit in ('oros','copas','espadas','bastos'):
    for r in ['01','02','03','04','05','06','07','08','09','sota','caballo','rey']:
        kw,up,rev=m.N[f'{suit}-{r}']
        out[f'{suit}-{r}']={"keywords":kw,"upright":conv(up),"reversed":conv(rev)}
assert len(out)==48 and len(m.N)==48
open(sys.argv[1],'w',encoding='utf-8',newline='\n').write(json.dumps(out,ensure_ascii=False,indent=2)+'\n'); print('ok',len(out))
