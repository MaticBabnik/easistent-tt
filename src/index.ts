import "reflect-metadata";

import { version } from "../package.json";
import { ApolloServer } from "apollo-server"
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core"
import { buildSchema, NonEmptyArray } from "type-graphql"

import { SchoolResolver } from "./resolvers/SchoolResolver"

import BasicTypeDefs from "./schemas/Types"
import { ConfigService } from "./services/ConfigService";
import Container from "typedi";
import { ApolloGraphiqlLandingPage } from "./apollo-graphiql-plugin";
import { SchoolService } from "./services/SchoolService";


console.log(`easistent-tt @ ${version}`);



const config = Container.get(ConfigService).get();
const school = Container.get(SchoolService); // get the school service in order to force it to load the data


async function main() {
    const typeDefs = [...BasicTypeDefs];
    const resolvers: NonEmptyArray<Function> = [SchoolResolver as Function];

    const schema = await buildSchema({
        resolvers,
        emitSchemaFile: true,
        container: Container
    });

    const envPlugins = process.env.NODE_ENV === "production" ? [
        ApolloGraphiqlLandingPage()
    ] : [
        ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ];

    const server = new ApolloServer({
        schema,
        csrfPrevention: true,
        cache: 'bounded',
        plugins : [...envPlugins],
        introspection: true
    });

    server.listen({ port: config.port }).then(({ url }) => {
        console.log(`🚀  Server ready at ${url}`);
    });
}


main();