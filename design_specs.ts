
import { PLAN_MD } from './specs/01_plan';
import { REQS_MD } from './specs/02_reqs';
import { TODO_MD } from './specs/03_todo';
import { SYSTEM_GUIDE_MD } from './specs/04_system_guide';
import { TEST_MD } from './specs/test';
import { PROTO_MEETINGBRIDGE_MD } from './specs/proto_meetingbridge';
import { PROTO_A_MD } from './specs/proto_a';
import { SERVER_MEETINGBRIDGE_MD } from './specs/server_meetingbridge';
import { DESIGNTANKAR_MD } from './specs/designtankar';
import { RAG_CONTEXT_MD } from './specs/rag_context';
import { VISION_EXPANSION_MD } from './specs/vision_expansion';

// Aggregating individual files into the legacy SPECS object 
// to ensure compatibility with SpecEditor without complex refactoring.
export const SPECS: Record<string, string> = {
  '01_plan.md': PLAN_MD,
  '02_reqs.md': REQS_MD,
  '03_todo.md': TODO_MD,
  '04_system_guide.md': SYSTEM_GUIDE_MD,
  'test.md': TEST_MD,
  'proto_meetingbridge.md': PROTO_MEETINGBRIDGE_MD,
  'proto_a.md': PROTO_A_MD,
  'server_meetingbridge.md': SERVER_MEETINGBRIDGE_MD,
  'designtankar.md': DESIGNTANKAR_MD,
  'rag_context.md': RAG_CONTEXT_MD,
  'vision_expansion.md': VISION_EXPANSION_MD
};