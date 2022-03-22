const createProxyMiddleware = require('http-proxy-middleware');

// This proxies /auth requests to the backend
// https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually
module.exports = function(app) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'https://localhost:5000',
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
  '/api',
  createProxyMiddleware({
      target: 'https://localhost:5000',
      changeOrigin: true,
      secure: false,
    })
  );
};

