import unittest,sys,json,hashlib
from datetime import datetime,timezone
from types import SimpleNamespace
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import fake_genlayer as fake
sys.modules['genlayer']=fake
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'contracts'))
from parcelproof import ParcelProof,digest
B='0x'+'1'*40; S='0x'+'2'*40; X='0x'+'3'*40
T=int(datetime(2026,9,14,tzinfo=timezone.utc).timestamp())
U='https://www.ups.com/track?loc=en_US&tracknum=PP-1234'
P='https://www.ups.com/proof/PP-1234'
class Tests(unittest.TestCase):
    def setUp(self):
        fake.transfers.clear();fake.pages.clear();fake.web_calls.clear();fake.fail_transfer=False;fake.prompt_error=False
        fake.response={'verdict':'INCONCLUSIVE','delivered_at':0,'citations':[]}
        self.c=ParcelProof('');self.context(B,T,100)
    def context(self,caller=B,t=T,value=0):
        fake.gl.message.sender_address=fake.Address(caller);fake.gl.message.value=value
        fake.gl.message_raw['datetime']=datetime.fromtimestamp(t,timezone.utc).isoformat()
    def create(self,**kw):
        d=dict(order_id='o1',seller=S,description='Item',shipment_reference='PP-1234',recipient_commitment=digest('Colombo 00700'),recipient_hint='Colombo 00700',carrier='UPS',tracking_url=U,delivery_proof_url=P,delivery_deadline=T+300,acceptance_seconds=60,shipping_seconds=60,challenge_seconds=60,retry_seconds=120,late_outcome='BUYER_REFUND',tracking_hash='',proof_hash='');d.update(kw)
        self.context(B,T,100);return fake.tx(self.c,'create_order',*d.values())
    def order(self): return json.loads(self.c.get_order('o1'))
    def accepted(self):
        self.create();self.context(S,T+10);fake.tx(self.c,'accept_order','o1',self.order()['terms_hash'])
    def shipped(self):
        self.accepted();self.context(S,T+20);fake.tx(self.c,'mark_shipped','o1','PP-1234')
    def disputed(self):
        self.shipped();self.context(B,T+30);fake.tx(self.c,'open_dispute','o1','Not received')
    def resolve(self,v='DELIVERED',d=T+100,c=None,t=T+310):
        fake.response=dict(verdict=v,delivered_at=d,citations=[U] if c is None else c)
        self.context(B,t);fake.tx(self.c,'resolve_dispute','o1')
    def conserved(self):
        x=json.loads(self.c.get_accounting());self.assertEqual(int(x['deposited']),sum(int(x[k]) for k in ('locked','claimable','emitted')))
    def test_create_and_hash(self):
        self.create();self.assertEqual(self.order()['status'],'OPEN');self.assertEqual(len(self.order()['terms_hash']),64);self.conserved()
    def test_zero_value(self):
        self.context(B,T,0)
        with self.assertRaises(fake.UserError): self.c.create_order('o1',S,'item','PP-1234',digest('Colombo 00700'),'Colombo 00700','UPS',U,P,T+300,60,60,60,120,'BUYER_REFUND','','')
    def test_duplicate(self):
        self.create()
        with self.assertRaises(fake.UserError): self.create()
    def test_unauthorized_accept(self):
        self.create();self.context(X,T+5)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'accept_order','o1',self.order()['terms_hash'])
    def test_wrong_terms(self):
        self.create();self.context(S,T+5)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'accept_order','o1','bad')
    def test_accept_boundary(self):
        self.create();self.context(S,T+60)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'accept_order','o1',self.order()['terms_hash'])
        self.context(B,T+60);fake.tx(self.c,'resolve_timeout','o1');self.conserved()
    def test_wrong_shipment(self):
        self.accepted();self.context(S,T+20)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'mark_shipped','o1','OTHER')
    def test_shipping_timeout(self):
        self.accepted();self.context(B,T+70);fake.tx(self.c,'resolve_timeout','o1');self.assertEqual(self.order()['beneficiary'],B);self.conserved()
    def test_cancel_and_claim(self):
        self.create();fake.tx(self.c,'cancel_order','o1');fake.tx(self.c,'claim_buyer_refund','o1');self.assertEqual(fake.transfers,[(B,100)]);self.conserved()
    def test_cancel_after_accept(self):
        self.accepted();self.context(B,T+15)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'cancel_order','o1')
    def test_confirm_delivery_and_claim(self):
        self.shipped();self.context(B,T+40);fake.tx(self.c,'confirm_delivery','o1');self.context(S,T+41);fake.tx(self.c,'claim_seller_payment','o1');self.assertEqual(fake.transfers,[(S,100)]);self.conserved()
    def test_seller_cannot_confirm(self):
        self.shipped()
        with self.assertRaises(fake.UserError): fake.tx(self.c,'confirm_delivery','o1')
    def test_double_claim(self):
        self.test_confirm_delivery_and_claim()
        with self.assertRaises(fake.UserError): fake.tx(self.c,'claim_seller_payment','o1')
    def test_wrong_beneficiary_claim(self):
        self.shipped();self.context(B,T+40);fake.tx(self.c,'confirm_delivery','o1')
        with self.assertRaises(fake.UserError): fake.tx(self.c,'claim_buyer_refund','o1')
    def test_failed_emission_rolls_back(self):
        self.create();fake.tx(self.c,'cancel_order','o1');fake.fail_transfer=True
        with self.assertRaises(fake.UserError): fake.tx(self.c,'claim_buyer_refund','o1')
        self.assertEqual(self.order()['status'],'SETTLED');self.conserved()
    def test_exact_source_hosts(self):
        for u in ('https://www.ups.com.evil.com/x','https://evilups.com/x','https://www.ups.com@evil.com/x','http://www.ups.com/x','https://www.ups.com:443/x','https://www.ups.com/x#f'):
            with self.subTest(u=u),self.assertRaises((fake.UserError,ValueError)): self.create(tracking_url=u)
    def test_fixture_disabled(self):
        with self.assertRaises(fake.UserError): self.create(carrier='FIXTURE')
    def test_evidence_roles_and_immutability(self):
        self.disputed();self.context(S,T+40);fake.tx(self.c,'submit_evidence','o1','Carrier says delivered',digest('Carrier says delivered'));self.context(B,T+41);fake.tx(self.c,'submit_counter_evidence','o1','Wrong recipient',digest('Wrong recipient'))
        self.assertEqual(len(self.order()['seller_evidence']),1);self.assertEqual(len(self.order()['buyer_evidence']),1)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'submit_evidence','o1','x',digest('x'))
    def test_evidence_hash(self):
        self.disputed();self.context(S,T+40)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'submit_evidence','o1','x','a'*64)
    def test_evidence_deadline(self):
        self.disputed();self.context(B,T+90)
        with self.assertRaises(fake.UserError): fake.tx(self.c,'submit_counter_evidence','o1','x',digest('x'))
    def test_no_resolution_before_delivery(self):
        self.disputed()
        with self.assertRaises(fake.UserError): self.resolve(t=T+100)
    def test_no_resolution_before_challenge_closes(self):
        self.shipped();self.context(B,T+290);fake.tx(self.c,'open_dispute','o1','missing')
        with self.assertRaises(fake.UserError): self.resolve(t=T+310)
    def test_delivered(self):
        self.disputed();self.resolve();self.assertEqual(self.order()['beneficiary'],S);self.conserved()
    def test_not_delivered(self):
        self.disputed();self.resolve('NOT_DELIVERED',0);self.assertEqual(self.order()['beneficiary'],B);self.conserved()
    def test_late_refund(self):
        self.disputed();self.resolve('LATE',T+305);self.assertEqual(self.order()['beneficiary'],B)
    def test_late_payment(self):
        self.create(late_outcome='SELLER_PAYMENT');self.context(S,T+10);fake.tx(self.c,'accept_order','o1',self.order()['terms_hash']);self.context(S,T+20);fake.tx(self.c,'mark_shipped','o1','PP-1234');self.context(B,T+30);fake.tx(self.c,'open_dispute','o1','missing');self.resolve('LATE',T+305);self.assertEqual(self.order()['beneficiary'],S)
    def test_impossible_delivery_timestamp(self):
        for d in (T+10,T+301,T+500):
            self.setUp();self.disputed();self.resolve(d=d);self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_nonfetched_citation(self):
        self.disputed();self.resolve(c=['https://evil.com']);self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_missing_citation(self):
        self.disputed();self.resolve(c=[]);self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_outage_and_timeout(self):
        self.disputed();fake.pages[U]=SimpleNamespace(status=503,body=b'error');self.resolve();self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW');self.assertEqual(self.c.total_locked,100);self.context(B,self.order()['terminal_at']);fake.tx(self.c,'resolve_timeout','o1');fake.tx(self.c,'claim_buyer_refund','o1');self.conserved()
    def test_source_hash_mismatch(self):
        self.create(tracking_hash='a'*64);self.context(S,T+10);fake.tx(self.c,'accept_order','o1',self.order()['terms_hash']);self.context(S,T+20);fake.tx(self.c,'mark_shipped','o1','PP-1234');self.context(B,T+30);fake.tx(self.c,'open_dispute','o1','missing');self.resolve();self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_oversized_page(self):
        self.disputed();fake.pages[U]=SimpleNamespace(status=200,body=b'x'*64001);self.resolve();self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_missing_destination_is_inconclusive(self):
        self.disputed();fake.pages[U]=SimpleNamespace(status=200,body=b'PP-1234 Wrong City');fake.pages[P]=SimpleNamespace(status=200,body=b'PP-1234 Wrong City');self.resolve();self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_wrong_tracking_reference_is_inconclusive(self):
        self.disputed();fake.pages[U]=SimpleNamespace(status=200,body=b'OTHER-TRACKING Colombo 00700');self.resolve();self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_recipient_commitment_mismatch(self):
        with self.assertRaises(fake.UserError):self.create(recipient_commitment='a'*64)
    def test_evidence_capacity_is_bounded(self):
        self.disputed();self.context(S,T+40)
        for i in range(4):fake.tx(self.c,'submit_evidence','o1',str(i),digest(str(i)))
        with self.assertRaises(fake.UserError):fake.tx(self.c,'submit_evidence','o1','extra',digest('extra'))
    def test_late_opening_preserves_full_evidence_window(self):
        self.shipped();self.context(B,T+359);fake.tx(self.c,'open_dispute','o1','missing');o=self.order();self.assertGreater(o['terminal_at'],o['evidence_close']);self.assertEqual(o['evidence_close'],T+419)
    def test_bad_llm_response(self):
        self.disputed();fake.response='```invalid```';self.context(B,T+310);fake.tx(self.c,'resolve_dispute','o1');self.assertEqual(self.order()['status'],'EVIDENCE_REVIEW')
    def test_retry_success(self):
        self.disputed();self.resolve('INCONCLUSIVE',0,[]);self.resolve();self.assertEqual(self.order()['beneficiary'],S);self.assertEqual(self.order()['attempts'],2)
    def test_retry_limit_does_not_extend_timeout(self):
        self.disputed();terminal=self.order()['terminal_at']
        for _ in range(5):self.resolve('INCONCLUSIVE',0,[])
        with self.assertRaises(fake.UserError):self.resolve()
        self.assertEqual(self.order()['terminal_at'],terminal);self.context(B,terminal);fake.tx(self.c,'resolve_timeout','o1');self.conserved()
    def test_shipped_without_dispute_can_timeout(self):
        self.shipped();self.context(B,self.order()['terminal_at']);fake.tx(self.c,'resolve_timeout','o1');self.conserved()
    def test_no_early_timeout(self):
        self.shipped();self.context(B,T+299)
        with self.assertRaises(fake.UserError):fake.tx(self.c,'resolve_timeout','o1')
    def test_terminal_state_cannot_reopen(self):
        self.create();fake.tx(self.c,'cancel_order','o1')
        for method,args in [('open_dispute',('o1','x')),('resolve_timeout',('o1',)),('accept_order',('o1',self.order()['terms_hash']))]:
            with self.assertRaises(fake.UserError):fake.tx(self.c,method,*args)
    def test_fixture_commit_binding(self):
        self.c=ParcelProof('b'*40)
        self.c._source('FIXTURE','https://raw.githubusercontent.com/amzar1st/ParcelProof/'+'b'*40+'/fixtures/delivered.json')
        with self.assertRaises(fake.UserError):self.c._source('FIXTURE','https://raw.githubusercontent.com/amzar1st/ParcelProof/main/fixtures/delivered.json')
if __name__=='__main__':unittest.main()
