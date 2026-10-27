import os, unittest
from unittest.mock import AsyncMock, patch
import httpx
os.environ['DATABASE_URL']='sqlite://'
from app.services import ai_service as ai

class AIErrorTests(unittest.IsolatedAsyncioTestCase):
 async def run_call(self,responses):
  client=AsyncMock();client.post.side_effect=responses
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(ai.httpx,'AsyncClient') as cls,patch.object(ai.asyncio,'sleep',new_callable=AsyncMock) as sleep:
   cls.return_value.__aenter__.return_value=client
   try: result=await ai.request_ai({'model':'test'},999)
   except ai.HTTPException as exc: result=exc
   self.assertNotIn(999,ai._active)
   return result,client.post.call_count,sleep
 def response(self,code,kind,message='test',status=429):
  return httpx.Response(status,json={'error':{'code':code,'type':kind,'message':message}})
 async def test_quota_not_retried(self):
  result,count,_=await self.run_call([self.response('insufficient_quota','insufficient_quota')])
  self.assertEqual(result.status_code,503);self.assertEqual(count,1)
 async def test_temporary_rate_recovers(self):
  result,count,_=await self.run_call([self.response('rate_limit_exceeded','tokens'),httpx.Response(200,json={'status':'completed'})])
  self.assertEqual(result['status'],'completed');self.assertEqual(count,2)
 async def test_large_request_not_retried(self):
  result,count,_=await self.run_call([self.response('rate_limit_exceeded','tokens','Request too large')])
  self.assertEqual(result.status_code,429);self.assertEqual(count,1)
 async def test_auth_failure(self):
  result,count,_=await self.run_call([self.response('invalid_api_key','invalid_request_error',status=401)])
  self.assertEqual(result.status_code,503)
 def test_redaction(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':'secret-value'}):
   self.assertNotIn('secret-value',ai.safe_diagnostic('secret-value sk-testsecret'))
   self.assertNotIn('sk-testsecret',ai.safe_diagnostic('sk-testsecret'))
if __name__=='__main__': unittest.main()
