import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';


// Set the AWS Region.
const REGION = process.env.REGION || 'local';
const ENDPOINT = process.env.DB_ENDPOINT || 'http://localhost:8000';

const config: DynamoDBClientConfig = {
  region: REGION,
  endpoint: ENDPOINT,
};

const dynamodb = new DynamoDBClient(config);

export default dynamodb;
