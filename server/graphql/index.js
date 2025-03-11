/**
 * index.js
 * 
 * Bu dosya, GraphQL sunucusunu oluşturur ve yapılandırır.
 * Apollo Server kullanarak GraphQL API'sini sunar.
 */

const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const express = require('express');
const http = require('http');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

/**
 * GraphQL sunucusunu oluşturma
 * @param {Object} app - Express uygulaması
 * @param {Object} httpServer - HTTP sunucusu
 * @returns {ApolloServer} - Apollo Server
 */
const createGraphQLServer = (app, httpServer) => {
  // Apollo Server oluşturma
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        },
      };
    },
    context: ({ req }) => {
      // İstek bilgilerini içeren bağlam
      return {
        req,
        ip: req.ip,
        headers: req.headers,
      };
    },
  });
  
  return server;
};

/**
 * GraphQL sunucusunu başlatma
 * @param {Object} app - Express uygulaması
 * @param {Object} httpServer - HTTP sunucusu
 * @param {string} path - GraphQL yolu
 * @returns {Promise<ApolloServer>} - Apollo Server
 */
const startGraphQLServer = async (app, httpServer, path = '/graphql') => {
  const server = createGraphQLServer(app, httpServer);
  
  // Sunucuyu başlatma
  await server.start();
  
  // Express ile entegrasyon
  server.applyMiddleware({
    app,
    path,
    cors: {
      origin: '*',
      credentials: true,
    },
  });
  
  console.log(`🚀 GraphQL sunucusu hazır: ${path}`);
  
  return server;
};

/**
 * Bağımsız GraphQL sunucusu oluşturma
 * @param {number} port - Port numarası
 * @param {string} path - GraphQL yolu
 * @returns {Promise<Object>} - Sunucu ve uygulama
 */
const createStandaloneGraphQLServer = async (port = 4000, path = '/graphql') => {
  const app = express();
  const httpServer = http.createServer(app);
  
  // CORS, JSON ve diğer middleware'ler
  app.use(express.json());
  
  // GraphQL sunucusunu başlatma
  const server = await startGraphQLServer(app, httpServer, path);
  
  // HTTP sunucusunu başlatma
  await new Promise((resolve) => httpServer.listen({ port }, resolve));
  
  console.log(`🚀 HTTP sunucusu hazır: http://localhost:${port}${server.graphqlPath}`);
  
  return { server, app, httpServer };
};

module.exports = {
  createGraphQLServer,
  startGraphQLServer,
  createStandaloneGraphQLServer,
}; 