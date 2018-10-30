import { GraphQLSchema } from 'graphql';
import mergeSchemas from 'graphql-tools/dist/stitching/mergeSchemas';
import {
    introspectSchema,
    makeExecutableSchema,
    makeRemoteExecutableSchema,
    RenameRootFields,
    RenameTypes, transformSchema,
    addErrorLoggingToSchema,
} from 'graphql-tools';
import fetch from 'node-fetch';
import { HttpLink } from 'apollo-link-http';
import { remoteSchemaDetails } from './remote-config';
import modules from '../modules';
import { logger } from '@common-stack/server-core';
import { IResolverOptions } from '@common-stack/server-core';
import * as rootSchemaDef from './root-schema.graphqls';
import { settings } from '../modules/module';
import { pubsub } from '../modules/pubsub';
import * as ws from 'ws';
import { getMainDefinition } from 'apollo-utilities';
import { WebSocketLink } from 'apollo-link-ws';
import { OperationDefinitionNode } from 'graphql';
import { split } from 'apollo-link';

const resolverOptions: IResolverOptions = {
    pubsub,
    subscriptionID: `${settings.subTopic}`,
    logger,
};

const directiveOptions = {
    logger,
};

export class GatewaySchemaBuilder {


    public async build(): Promise<GraphQLSchema> {
        let schema, ownSchema;
        try {
            ownSchema = this.createOwnSchema();
            let remoteSchema = await this.load();
            // techSchema = this.patchSchema(techSchema, 'TechService');

            schema = mergeSchemas({
                schemas: [
                    ownSchema,
                    remoteSchema,
                ],
            });
            addErrorLoggingToSchema(schema, { log: (e) => logger.error(e) });

        } catch (err) {
            logger.warn('remote service is empty!');
            schema = ownSchema;
        }

        return schema;
    }

    private async load() {
        const schemas = [];
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < remoteSchemaDetails.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            const schema = await this.loadRemoteSchema(remoteSchemaDetails[i]);
            schemas.push(schema);
        }
        return schemas;
    }

    private async createRemoteSchema(service: string, iteration?: number): Promise<GraphQLSchema> {
        logger.info('Fetch service [%s] iteration [%s]', service, iteration);
        const services = remoteSchemaDetails;
        if (!services.length) {
            console.warn(`Service ${services} is undefined`);
            if (iteration && iteration > 2) {
                return Promise.reject(`tried upto ${iteration} attempts, now failing...`);
            }
            return new Promise<GraphQLSchema>(((resolve, reject) => {
                const timeout = iteration ? 1000 * iteration : 1000;
                logger.info('Wait for service startup %s', timeout);
                setTimeout(() => {
                    this.createRemoteSchema(service, iteration ? iteration + 1 : 1).then(resolve).catch(reject);
                }, timeout);
            }));
        }
        // instead need to loop it
        // https://github.com/j-colter/graphql-gateway/blob/9c64d90a74727d2002d10b06f47e1f4a316070fc/src/schema.js#L50
        const url = services[0].uri;
        logger.info('fetch service [%s]', url);
        // 1. Create apollo Link that's connected to the underlying GraphQL API
        const link = new HttpLink({ uri: url, fetch });

        // 2. Retrieve schema definition of the underlying GraphQL API
        const remoteSchema = await introspectSchema(link as any);

        // 3. Create the executable schema based on schema definition and Apollo Link
        return makeRemoteExecutableSchema({
            schema: remoteSchema,
            link,
        });


    }


    private async loadRemoteSchema({ uri, wsUri }) {
        try {
            const httpLink = new HttpLink({ uri, fetch });
            let link = null;


            if (wsUri) {
                const wsLink = new WebSocketLink({
                    uri: wsUri,
                    options: {
                        reconnect: true,
                    },
                    webSocketImpl: ws,
                });
                link = split(
                    // split based on operatino type
                    ({ query }) => {
                        const { kind, operation } = getMainDefinition(query) as OperationDefinitionNode;
                        return kind === 'OperationDefinition' && operation === 'subscription';
                    },
                    wsLink,
                    httpLink,
                );
            } else {
                link = httpLink;
            }
            const remoteSchema = await introspectSchema(link);
            const executableSchema = makeRemoteExecutableSchema({
                schema: remoteSchema,
                link,
            });
            return executableSchema;
        } catch (err) {
            console.log('fetching schema error: ', err);
            return {};
        }
    }
    private patchSchema(schema: GraphQLSchema, systemName: string) {
        return transformSchema(schema, [
            new RenameTypes((name: string) => (name === 'StatusInfo' ? `${systemName}StatusInfo` : undefined)),
            new RenameRootFields(
                (_operation: string, name: string) =>
                    name === 'status' ? `${systemName.substring(0, 1).toLowerCase()}${systemName.substring(1)}Status` : name,
            ),
        ]);
    }

    private createOwnSchema(): GraphQLSchema {
        return makeExecutableSchema({
            resolvers: modules.createResolvers(resolverOptions),
            typeDefs: [rootSchemaDef].concat(modules.schemas) as any,
            directiveResolvers: modules.createDirectives(directiveOptions),
            resolverValidationOptions: {
                requireResolversForResolveType: false,
            },
        });
    }

}
