"""Unit-test double only. No consensus or real transfer claims are made by these tests."""
from types import SimpleNamespace
import copy

class UserError(Exception): pass
class Address(str):
    def __new__(cls, value):
        if len(value) != 42 or not value.startswith('0x') or any(c not in '0123456789abcdefABCDEF' for c in value[2:]): raise ValueError('address')
        return super().__new__(cls, value.lower())
u256 = int
TreeMap = dict
DynArray = list
class Contract:
    def __init_subclass__(cls): pass
    def __new__(cls, *args):
        obj = super().__new__(cls)
        obj.orders = {}; obj.order_ids = []
        return obj
class Decorator:
    def __call__(self, f): return f
    payable = staticmethod(lambda f:f)
transfers=[]
fail_transfer=False
class Proxy:
    def __init__(self,address): self.address=address
    def emit_transfer(self,value):
        if fail_transfer: raise UserError('transfer emission failed')
        transfers.append((self.address,value))
def interface(cls): return Proxy
pages={}
response = {'verdict':'INCONCLUSIVE','delivered_at':0,'citations':[]}
prompt_error=False
web_calls=[]
def get(url):
    web_calls.append(url)
    value = pages.get(url, SimpleNamespace(status_code=200,body=b'PP-1234 Colombo 00700'))
    if isinstance(value,Exception): raise value
    return value
def prompt(text):
    import json
    if prompt_error: raise ValueError('provider down')
    return response if isinstance(response,str) else json.dumps(response)
gl=SimpleNamespace(Contract=Contract,public=SimpleNamespace(write=Decorator(),view=Decorator()),vm=SimpleNamespace(UserError=UserError),evm=SimpleNamespace(contract_interface=interface),message=SimpleNamespace(sender_address=Address('0x'+'1'*40),value=100),message_raw={'datetime':'2026-09-14T00:00:00+00:00'},eq_principle=SimpleNamespace(strict_eq=lambda f:f()),nondet=SimpleNamespace(web=SimpleNamespace(get=get),exec_prompt=prompt))

def tx(contract, method, *args):
    snapshot=copy.deepcopy(contract.__dict__)
    count=len(transfers)
    try: return getattr(contract,method)(*args)
    except Exception:
        contract.__dict__=snapshot
        del transfers[count:]
        raise
