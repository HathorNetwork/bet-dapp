import {
  AttributeValue,
  CreateTableCommand,
  CreateTableInput,
  DeleteTableCommand,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
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
  createdAt: number;
}

export interface DynamoNanoContract {
  id: AttributeValue;
  timestamp: AttributeValue;
  title: AttributeValue;
  oracleType: AttributeValue;
  oracle: AttributeValue;
  description?: AttributeValue;
  createdAt: AttributeValue;
}

const getNanoContractEntity = ({ id, title, description, timestamp, oracle, oracleType, createdAt }: DynamoNanoContract) => {
  const nanoContract: Partial<NanoContract> = {};
  nanoContract.id = id.S;
  nanoContract.title = title.S;
  nanoContract.description = description?.S;
  nanoContract.oracle = oracle.S;
  nanoContract.oracleType = oracleType.S;
  nanoContract.timestamp = timestamp?.N ? parseFloat(timestamp.N) : undefined;
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
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, createdAt',
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
    ProjectionExpression: '#ts, id, title, description, oracleType, oracle, createdAt',
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

export const params: CreateTableInput = {
  AttributeDefinitions: [{
    AttributeName: 'id',
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
};

export async function createTable() {
  await dynamodb.send(new CreateTableCommand(params));
};

export async function deleteTable() {
  await dynamodb.send(new DeleteTableCommand({
    TableName: TABLE_NAME,
  }));
}
