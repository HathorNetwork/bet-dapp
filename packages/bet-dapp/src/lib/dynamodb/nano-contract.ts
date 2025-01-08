import {
  AttributeValue,
  CreateTableCommand,
  CreateTableInput,
  DeleteTableCommand,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import dynamoDb from './dynamodb-client';

export const TABLE_NAME = 'NanoContracts';

export interface NanoContract {
  id: string;
  timestamp: number;
  title: string;
  oracleType: string;
  oracle: string;
  description?: string;
  creatorAddress?: string;
  createdAt: number;
  options: string[];
}

export interface DynamoNanoContract {
  id: AttributeValue;
  timestamp: AttributeValue;
  title: AttributeValue;
  oracleType: AttributeValue;
  oracle: AttributeValue;
  description?: AttributeValue;
  creatorAddress?: AttributeValue;
  createdAt: AttributeValue;
  options: AttributeValue;
}

const getNanoContractEntity = ({ id, title, description, timestamp, oracle, oracleType, creatorAddress, createdAt, options }: DynamoNanoContract) => {
  const nanoContract: Partial<NanoContract> = {};
  nanoContract.id = id.S;
  nanoContract.title = title.S;
  nanoContract.description = description?.S;
  nanoContract.oracle = oracle.S;
  nanoContract.oracleType = oracleType.S;
  nanoContract.timestamp = timestamp?.N ? parseFloat(timestamp.N) : undefined;
  nanoContract.creatorAddress = creatorAddress?.S;
  nanoContract.createdAt = createdAt?.N ? parseFloat(createdAt.N) : undefined;
  nanoContract.options = options?.L?.map(item => item.S) || [];

  return nanoContract as NanoContract;
};

export const createNanoContract = async ({
  id,
  timestamp,
  title,
  oracleType,
  oracle,
  description,
  creatorAddress,
  createdAt,
  options,
}: NanoContract): Promise<NanoContract> => {
  const params: PutItemCommandInput = {
    TableName: TABLE_NAME,
    Item: {
      id: { S: id },
      timestamp: { N: timestamp.toString() },
      title: { S: title },
      description: { S: description || '' },
      oracleType: { S: oracleType },
      oracle: { S: oracle },
      creatorAddress: { S: creatorAddress || '' },
      createdAt: { N: createdAt.toString() },
      options: { 
        L: options.map(option => ({ S: option }))
      },
    },
  };

  await dynamoDb.send(new PutItemCommand(params));

  return {
    id,
    timestamp,
    title,
    oracleType,
    oracle,
    description,
    creatorAddress,
    createdAt,
    options,
  };
}

export const getAllNanoContracts = async () => {
  const params: ScanCommandInput = {
    TableName: TABLE_NAME,
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, creatorAddress, createdAt, options',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
  };

  const scanResults: DynamoNanoContract[] = [];
  let items;

  do {
    items = await dynamoDb.send(new ScanCommand(params));
    items.Items?.forEach((item) => scanResults.push(item as unknown as DynamoNanoContract));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");

  return scanResults.map(getNanoContractEntity);
};

export const getNanoContractById = async (id: string) => {
  const params: GetItemCommandInput = {
    TableName: TABLE_NAME,
    Key: {
      id: { S: id },
    },
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, creatorAddress, createdAt, options',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
  };

  const data = await dynamoDb.send(
    new GetItemCommand(params)
  );

  if (!data.Item) {
    throw new Error('Not found');
  }

  return getNanoContractEntity(data.Item as unknown as DynamoNanoContract);
}

export const getNanoContractsByCreator = async (creatorAddress: string) => {
  const params: QueryCommandInput = {
    TableName: TABLE_NAME,
    IndexName: 'CreatorAddressIndex',
    KeyConditionExpression: 'creatorAddress = :creatorAddress',
    ExpressionAttributeValues: {
      ':creatorAddress': { S: creatorAddress },
    },
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, creatorAddress, createdAt',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
  };

  const queryResults: DynamoNanoContract[] = [];
  let items;

  do {
    items = await dynamoDb.send(new QueryCommand(params));
    items.Items?.forEach((item) => queryResults.push(item as unknown as DynamoNanoContract));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");

  return queryResults.map(getNanoContractEntity);
};

export const params: CreateTableInput = {
  AttributeDefinitions: [{
    AttributeName: 'id',
    AttributeType: 'S',
  }, {
    AttributeName: 'creatorAddress',
    AttributeType: 'S',
  }],
  KeySchema: [{
    AttributeName: 'id',
    KeyType: 'HASH',
  }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
  TableName: TABLE_NAME,
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'KEYS_ONLY',
  },
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CreatorAddressIndex',
      KeySchema: [
        {
          AttributeName: 'creatorAddress',
          KeyType: 'HASH',
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {  // Required for DynamoDB Local
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
};

export async function createTable() {
  await dynamoDb.send(new CreateTableCommand(params));
};

export async function deleteTable() {
  await dynamoDb.send(new DeleteTableCommand({
    TableName: TABLE_NAME,
  }));
}
