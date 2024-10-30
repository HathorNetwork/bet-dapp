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
import dynamodb from './dynamodb-client';

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
}

const getNanoContractEntity = ({ id, title, description, timestamp, oracle, oracleType, creatorAddress, createdAt }: DynamoNanoContract) => {
  const nanoContract: Partial<NanoContract> = {};
  nanoContract.id = id.S;
  nanoContract.title = title.S;
  nanoContract.description = description?.S;
  nanoContract.oracle = oracle.S;
  nanoContract.oracleType = oracleType.S;
  nanoContract.timestamp = timestamp?.N ? parseFloat(timestamp.N) : undefined;
  nanoContract.creatorAddress = creatorAddress?.S;
  nanoContract.createdAt = createdAt?.N ? parseFloat(createdAt.N) : undefined;

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
    },
  };

  await dynamodb.send(new PutItemCommand(params));

  return {
    id,
    timestamp,
    title,
    oracleType,
    oracle,
    description,
    createdAt,
  };
}

export const getAllNanoContracts = async () => {
  const params: ScanCommandInput = {
    TableName: TABLE_NAME,
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, creatorAddress, createdAt',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
  };

  const scanResults: DynamoNanoContract[] = [];
  let items;

  do {
    items = await dynamodb.send(new ScanCommand(params));
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
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, creatorAddress, createdAt',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
  };

  const data = await dynamodb.send(
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
    items = await dynamodb.send(new QueryCommand(params));
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
  await dynamodb.send(new CreateTableCommand(params));
};

export async function deleteTable() {
  await dynamodb.send(new DeleteTableCommand({
    TableName: TABLE_NAME,
  }));
}
