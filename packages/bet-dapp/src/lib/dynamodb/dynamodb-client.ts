import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.NODE_ENV === 'development';

const client = new DynamoDBClient({
  ...(isLocal
    ? {
        endpoint: 'http://localhost:8000',
        region: 'local',
        credentials: {
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
        },
      }
    : {
        region: process.env.AWS_REGION || 'us-east-1',
      }),
});

const dynamodb = DynamoDBDocumentClient.from(client);

export default dynamodb;
