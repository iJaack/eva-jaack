import type {
  CuratorDto,
  OnchainArticleDto,
  VerificationReportDto,
} from '../src/lib/api-types.js';

export const sampleReport: VerificationReportDto = {
  url: 'https://example.com/article',
  title: 'Sample article',
  claims: [
    {
      claim: {
        text: 'Avalanche is an EVM chain.',
        type: 'onchain',
        difficulty: 3,
      },
      score: 88,
      explanation: 'Confirmed by chain metadata.',
      sources: ['https://example.com/source'],
      dataSource: 'routescan',
    },
  ],
  overallScore: 88,
  verifiedAt: '2026-03-24T00:00:00.000Z',
  oracleAgentId: 1599,
  routescanUsed: true,
};

export const sampleArticle: OnchainArticleDto = {
  id: 7,
  curator: '0x1111111111111111111111111111111111111111',
  articleHash: '0xarticlehash',
  sourceURI: 'https://example.com/article',
  requestHash: '0xrequesthash',
  evidenceURI: 'ipfs://report',
  responseHash: '0xresponsehash',
  validationTag: 'article',
  submittedAt: 1710000000,
  verifiedAt: 1710000600,
  verificationScore: 88,
  premium: false,
  status: 1,
};

export const sampleCurator: CuratorDto = {
  address: '0x1111111111111111111111111111111111111111',
  registered: true,
  curatorAgentId: '2001',
  selfStake: '1000000000000000000',
  delegatedStake: '500000000000000000',
  pendingSelfYield: '0',
  trustScore: 72,
  registeredAt: 1710000000,
  lastTrustUpdate: 1710000500,
  lastArticleAt: 1710000600,
  articleCount: 3,
};
