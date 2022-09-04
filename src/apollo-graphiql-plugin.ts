import type {
    ApolloServerPlugin,
    GraphQLServerListener,
} from 'apollo-server-plugin-base';

export function ApolloGraphiqlLandingPage(): ApolloServerPlugin {
    return {
        async serverWillStart(): Promise<GraphQLServerListener> {
            return {
                async renderLandingPage() {
                    return {
                        html: `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <style>
                              body {
                                height: 100%;
                                margin: 0;
                                width: 100%;
                                overflow: hidden;
                              }
                              #graphiql {
                                height: 100vh;
                              }
                            </style>
                            <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>
                            <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
                            <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css"/>
                          </head>
                          <body>
                            <div id="graphiql">Loading...</div>
                            <script src="https://unpkg.com/graphiql/graphiql.min.js" type="application/javascript"></script>
                            <script>
                              ReactDOM.render(
                                React.createElement(GraphiQL, {
                                  fetcher: GraphiQL.createFetcher({
                                    url: '/graphql',
                                  }),
                                  defaultEditorToolsVisibility: true,
                                  defaultQuery:"# glhf\\n#  - Matic"
                                }),
                                document.getElementById('graphiql'),
                              );
                            </script>
                          </body>
                        </html>
                        `
                    }
                }
            }
        }
    }
}