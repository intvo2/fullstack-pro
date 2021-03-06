/* eslint-disable global-require */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */
/* eslint-disable import/no-extraneous-dependencies */
import { GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { mergeSchemas } from '@graphql-tools/merge';
import { makeExecutableSchema, addErrorLoggingToSchema } from '@graphql-tools/schema';
import { linkToExecutor } from '@graphql-tools/links';
import { introspectSchema, makeRemoteExecutableSchema } from '@graphql-tools/wrap';
// import { transformSchema } from '@graphql-tools/delegate';
import * as ws from 'ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import { split } from '@apollo/client';
import { logger } from '@common-stack/server-core';
import { HttpLink } from '@apollo/client/link/http';
import * as fetch from 'isomorphic-fetch';
import { remoteSchemaDetails } from './remote-config';
import rootSchemaDef from './root-schema.graphqls';
import { resolvers as rootResolver } from './resolver';

export class GatewaySchemaBuilder {
    constructor(private options: { schema: string | string[]; resolvers; directives; logger }) {}

    public async build(): Promise<GraphQLSchema> {
        let schema;
        let ownSchema;
        try {
            ownSchema = this.createOwnSchema();
            const remoteSchema = await this.load();
            // techSchema = this.patchSchema(techSchema, 'TechService');

            schema = mergeSchemas({
                schemas: [ownSchema, remoteSchema],
            });
            // TODO after updating graphql-tools to v8
            addErrorLoggingToSchema(schema, { log: (e) => logger.error(e as Error) });
        } catch (err) {
            logger.error('[Graphql Schema Errors] when building schema::', err.message);
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
            return new Promise<GraphQLSchema>((resolve, reject) => {
                const timeout = iteration ? 1000 * iteration : 1000;
                logger.info('Wait for service startup %s', timeout);
                setTimeout(() => {
                    this.createRemoteSchema(service, iteration ? iteration + 1 : 1)
                        .then(resolve)
                        .catch(reject);
                }, timeout);
            });
        }
        // instead need to loop it
        // https://github.com/j-colter/graphql-gateway/blob/9c64d90a74727d2002d10b06f47e1f4a316070fc/src/schema.js#L50
        const url = services[0].uri;
        logger.info('fetch service [%s]', url);
        // 1. Create apollo Link that's connected to the underlying GraphQL API
        const link = new HttpLink({ uri: url, fetch });
        const executor: any = linkToExecutor(link);
        // 2. Retrieve schema definition of the underlying GraphQL API
        const remoteSchema = await introspectSchema(link as any);

        // 3. Create the executable schema based on schema definition and Apollo Link
        return makeRemoteExecutableSchema({
            schema: remoteSchema,
            executor,
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
            const executor: any = linkToExecutor(link);
            const remoteSchema = await introspectSchema(link);
            const executableSchema = makeRemoteExecutableSchema({
                schema: remoteSchema,
                executor,
            });
            return executableSchema;
        } catch (err) {
            this.options.logger.error('fetching schema error: ', err);
            return {};
        }
    }

    // disabled after updating to apollo-client to v3 and graphql-tools to v8
    // private patchSchema(schema: GraphQLSchema, systemName: string) {
    //     return transformSchema(schema, [
    //         new RenameTypes((name: string) => (name === 'StatusInfo' ? `${systemName}StatusInfo` : undefined)),
    //         new RenameRootFields((_operation: string, name: string) =>
    //             name === 'status'
    //                 ? `${systemName.substring(0, 1).toLowerCase()}${systemName.substring(1)}Status`
    //                 : name,
    //         ),
    //     ]);
    // }

    private createOwnSchema(): GraphQLSchema {
        const typeDefs = [rootSchemaDef, this.options.schema].join('\n');
        if (__DEV__) {
            const { ExternalModules } = require('../modules/module');
            const externalSchema = ExternalModules.schemas;
            const fs = require('fs');
            const writeData = `${externalSchema}`;
            fs.writeFileSync('./generated-schema.graphql', writeData);
        }
        return makeExecutableSchema({
            resolvers: [rootResolver, this.options.resolvers],
            typeDefs,
            // TODO disabled https://github.com/ardatan/graphql-tools/blob/e1fbc79e2714bae61aa0fa014a6231b151bb6c8e/website/docs/schema-directives.mdx#what-about-directiveresolvers
            directiveResolvers: this.options.directives,
            resolverValidationOptions: {
                requireResolversForResolveType: true,
            },
        });
    }
}
