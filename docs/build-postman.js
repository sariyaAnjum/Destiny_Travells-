/**
 * Generates postman/Destiny_Travels_API.postman_collection.json from docs/api-spec.js
 * Run:  node docs/build-postman.js
 */
const fs = require('fs');
const path = require('path');
const { challenges, items } = require('./api-spec');

const testScript = (item) => {
  const lines = [
    `pm.test('Status code is ${item.status}', function () {`,
    `  pm.response.to.have.status(${item.status});`,
    `});`,
    `pm.test('Response is JSON with success = ${item.status < 400}', function () {`,
    `  pm.expect(pm.response.json().success).to.eql(${item.status < 400});`,
    `});`,
  ];
  if (item.saves) {
    lines.push(
      `// Remember the new document's _id for the ID-based requests that follow`,
      `pm.collectionVariables.set('${item.saves}', pm.response.json().data._id);`
    );
  }
  return lines;
};

const buildRequest = (item) => {
  const [pathPart] = item.path.split('?');
  const segments = pathPart
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
  const query = item.query
    ? Object.entries(item.query).map(([key, value]) => ({ key, value }))
    : undefined;
  const queryRaw = query ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&') : '';

  const request = {
    method: item.method,
    header: item.body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
    url: {
      raw: `{{baseUrl}}${pathPart}${queryRaw}`,
      host: ['{{baseUrl}}'],
      path: segments,
      ...(query ? { query } : {}),
    },
    description: `${item.purpose}${item.mongoose ? `\n\nMongoose: ${item.mongoose}` : ''}`,
  };
  if (item.body) {
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(item.body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }
  return request;
};

const collection = {
  info: {
    name: 'Destiny Travels API',
    description:
      'Postman tests for the Destiny Travels API (Express.js + MongoDB + Mongoose).\n' +
      'Run the folders in order, or use the Collection Runner: requests build on each other.\n' +
      'Run `npm run seed` first for a clean database, or let request 02 insert the sample data.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000' },
    { key: 'destinationId', value: '' },
  ],
  item: challenges.map((challenge) => ({
    name: challenge.title,
    item: items
      .filter((item) => item.challenge === challenge.key)
      .map((item) => ({
        name: `${item.id.slice(0, 2)} - ${item.title}`,
        event: [
          {
            listen: 'test',
            script: { type: 'text/javascript', exec: testScript(item) },
          },
        ],
        request: buildRequest(item),
        response: [],
      })),
  })),
};

const outFile = path.join(__dirname, '..', 'postman', 'Destiny_Travels_API.postman_collection.json');
fs.writeFileSync(outFile, JSON.stringify(collection, null, 2));
console.log(`Wrote ${path.relative(process.cwd(), outFile)} (${items.length} requests)`);
