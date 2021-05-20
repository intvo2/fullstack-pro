import { ApolloClient, ApolloClientOptions } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
// import * as schema from '../schema/schema.graphql';
import { resolvers, defaults } from '../resolvers';
import { dataIdFromObject } from '../id-generation';

const defaultSchema = `
type Query {
    dummy: Int
}
type Mutation {
    dummy: Int
}
`;

const cache = new InMemoryCache({
    dataIdFromObject: (object) => getDataIdFromObject(object),
});

const  params: ApolloClientOptions<any> = {
    cache,
    resolvers,
    // typeDefs: defaultSchema.concat(schema as any), // if client schema exist
};
const links = [];

const client = new ApolloClient({
    queryDeduplication: true,
    link: ApolloLink.from(links),
    cache,
});

function getDataIdFromObject(result: any) {
    if (dataIdFromObject[result.__typename]) {
        return dataIdFromObject[result.__typename](result);
    }
    return result.id || result._id;
}

export { client, getDataIdFromObject };
