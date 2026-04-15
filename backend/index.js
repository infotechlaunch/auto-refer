const serverless = require('serverless-http');
const { app, ensureInitialized } = require('./src/server');

let isReady = false;
const handlerCache = new Map();

function resolveBasePath(event) {
	const stage = event && event.requestContext && event.requestContext.stage;
	if (!stage || stage === '$default') {
		return '';
	}
	return `/${stage}`;
}

function getServerHandler(basePath) {
	const key = basePath || '';
	if (!handlerCache.has(key)) {
		handlerCache.set(key, serverless(app, { basePath: key }));
	}
	return handlerCache.get(key);
}

module.exports.handler = async (event, context) => {
	// Keep Lambda from waiting on open DB/event-loop handles after response is ready.
	if (context) {
		context.callbackWaitsForEmptyEventLoop = false;
	}

	if (!isReady) {
		await ensureInitialized();
		isReady = true;
	}

	const basePath = resolveBasePath(event);
	const handler = getServerHandler(basePath);
	return handler(event, context);
};
