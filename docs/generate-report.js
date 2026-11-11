// Builds docs/Destiny_Travels_API_Report.docx
// Uses docs/screenshots/<id>.png (your real Postman screenshots) if present, else docs/screenshots/preview/<id>.png (sample panels).
const fs = require('fs');
const path = require('path');
const D = require('docx');
const sharp = require('sharp');
const { challenges, items, queryString } = require('./api-spec');

const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, PageBreak, Header, Footer, PageNumber, TableOfContents, LevelFormat,
} = D;

const root = path.join(__dirname, '..');
const NAVY = '1F3A5F', ACCENT = '2E75B6', GREY = '595959', LIGHT = 'EAF2FB';
const FONT = 'Calibri', MONO = 'Consolas';
const W = 9360; // content width (DXA) for US Letter w/ 1" margins

const p = (text, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, alignment: o.align, children: [new TextRun({ text, font: FONT, size: 22, ...o.run })], ...o.para });
const rich = (parts) => new Paragraph({ spacing: { after: 120, line: 276 }, children: parts.map(([t, b]) => new TextRun({ text: t, bold: !!b, font: FONT, size: 22 })) });
const bullet = (text) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, font: FONT, size: 22 })] });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const code = (text) => text.split('\n').map((l, i, a) => new Paragraph({
  spacing: { after: 0, line: 240 }, shading: { type: ShadingType.CLEAR, fill: 'F4F6F8' },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
  children: [new TextRun({ text: l || ' ', font: MONO, size: 17 })],
}));
const bd = { style: BorderStyle.SINGLE, size: 4, color: 'BFC7D1' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
const cell = (text, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, borders,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  margins: { top: 70, bottom: 70, left: 110, right: 110 },
  children: [new Paragraph({ children: [new TextRun({ text: String(text), font: o.mono ? MONO : FONT, size: o.mono ? 18 : 20, bold: o.bold, color: o.color })] })],
});
const table = (widths, header, rows, monoCols = []) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: widths,
  rows: [
    new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { fill: NAVY, bold: true, color: 'FFFFFF' })) }),
    ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? 'F7F9FB' : undefined, mono: monoCols.includes(i) })) })),
  ],
});
const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\n+$/, '');

async function image(file, maxW, maxH, caption) {
  const buf = fs.readFileSync(file);
  const m = await sharp(buf).metadata();
  let w = maxW, h = (maxW * m.height) / m.width;
  if (h > maxH) { h = maxH; w = (maxH * m.width) / m.height; }
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 60, after: 60 }, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: Math.round(w), height: Math.round(h) }, altText: { title: caption, description: caption, name: caption } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: caption, italics: true, size: 18, color: GREY, font: FONT })] }),
  ];
}

const methods = [
  ['create()', 'Insert one document', 'POST /api/destinations'],
  ['insertMany()', 'Insert an array of documents', 'POST /api/destinations/bulk'],
  ['find()', 'Fetch all / filtered documents', 'GET /api/destinations, /discover'],
  ['findById()', 'Fetch by _id', 'GET /api/destinations/:id'],
  ['findOne()', 'Fetch first match by name', 'GET /api/destinations/name/:name'],
  ['findByIdAndUpdate()', 'Update by _id', 'PUT /api/destinations/:id'],
  ['findOneAndUpdate()', 'Update by name', 'PUT /api/destinations/name/:name'],
  ['sort()', 'Order by price / rating', 'GET /api/destinations/discover'],
  ['skip()', 'Skip documents for pagination', 'GET /api/destinations/discover'],
  ['limit()', 'Cap documents per page', 'GET /api/destinations/discover'],
  ['distinct()', 'Unique category values', 'GET /api/destinations/categories'],
  ['countDocuments()', 'Count matching documents', 'GET /count, /discover'],
  ['findByIdAndDelete()', 'Delete by _id', 'DELETE /api/destinations/:id'],
  ['findOneAndDelete()', 'Delete by name', 'DELETE /api/destinations/name/:name'],
  ['deleteMany()', 'Delete by condition', 'DELETE /api/destinations/bulk'],
];

(async () => {
  const live = [], sample = [];
  const children = [];

  /* ---------- Cover ---------- */
  children.push(
    new Paragraph({ spacing: { before: 2400, after: 120 }, children: [new TextRun({ text: 'PROJECT REPORT', font: FONT, size: 24, bold: true, color: ACCENT, characterSpacing: 60 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Destiny Travels API', font: FONT, size: 72, bold: true, color: NAVY })] }),
    new Paragraph({ spacing: { after: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } }, children: [new TextRun({ text: 'Destination management with Express.js, MongoDB and Mongoose', font: FONT, size: 30, color: GREY })] }),
    table([2400, 6960], ['Item', 'Detail'], [
      ['Database', 'destiny_travels'], ['Collection', 'destinations'],
      ['Architecture', 'MVC (config, models, controllers, routes)'],
      ['Stack', 'Node.js, Express.js, MongoDB, Mongoose, Postman'],
      ['Endpoints', `${items.length - 6} functional + 5 error-handling checks`],
      ['Mongoose methods', `${methods.length} distinct (requirement: at least 10)`],
      ['Date', 'November 2026'],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contents', font: FONT, size: 36, bold: true, color: NAVY })] }),
    ...['1. Problem Statement','2. Architecture and Project Structure','3. Database Connection and Setup','4. Implementation Highlights','5. API Testing with Postman','6. Error Handling and Status Codes','7. Conclusion'].map((t) => new Paragraph({ spacing: { after: 160 }, border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: 'BFC7D1', space: 4 } }, children: [new TextRun({ text: t, font: FONT, size: 26, color: NAVY })] })),
    new Paragraph({ children: [new PageBreak()] }),
  );

  /* ---------- 1 Problem statement ---------- */
  children.push(
    h1('1. Problem Statement'),
    p('A travel company needs a back-end service to store and manage its destinations. Staff must be able to add destinations, look them up, correct their details, remove outdated ones, and help customers discover trips that fit their budget and interests.'),
    p('This project builds the Destiny Travels API: a REST service using Express.js, MongoDB and Mongoose, organised in the MVC pattern, that provides CRUD operations and advanced queries on a destinations collection.'),
    h2('1.1 Objectives'),
    ...challenges.slice(0, 5).map((c, i) => bullet(`${c.title.replace(/^Challenge \d+: /, '')} (${c.level}): ${[
      'add destinations with create() and insertMany().',
      'fetch all destinations with find(), one by ID with findById(), one by name with findOne().',
      'update by ID with findByIdAndUpdate() and by name with findOneAndUpdate().',
      'filter by category and price range, sort with sort(), paginate with skip() and limit(), list unique categories with distinct(), count with countDocuments().',
      'delete by ID with findByIdAndDelete(), by name with findOneAndDelete(), and by condition with deleteMany().',
    ][i]}`)),
    h2('1.2 Technical requirements'),
    bullet('MongoDB database destiny_travels, collection destinations.'),
    bullet('MVC structure with separate config, models, controllers and routes folders.'),
    bullet('At least 10 distinct Mongoose methods (this project uses 15).'),
    bullet('All endpoints tested with Postman.'),
    bullet('Proper error handling and HTTP status codes.'),
  );

  /* ---------- 2 Architecture ---------- */
  children.push(
    h1('2. Architecture and Project Structure'),
    p('A request enters server.js, is matched by a route, handled by a controller, and reaches MongoDB through the Mongoose model. Errors from any controller go to one central error handler that returns a consistent JSON body and the correct status code.'),
    ...(await image(path.join(__dirname, 'diagrams/architecture.png'), 610, 300, 'Figure 1: Request flow through the MVC layers')),
    h2('2.1 Folder structure'),
    ...code(read('README.md').match(/```\n(destiny-travels-api\/[\s\S]*?)```/)[1].trim()),
    spacer(),
    table([2700, 6660], ['Layer', 'Responsibility'], [
      ['config/db.js', 'Connects to MongoDB using MONGO_URI.'],
      ['models/Destination.js', 'Schema, validation rules and indexes.'],
      ['controllers/', 'One handler per endpoint; calls Mongoose methods.'],
      ['routes/', 'Maps HTTP method and URL to a controller.'],
      ['middleware/errorHandler.js', '404 handler and central error handler.'],
      ['seeder.js, data/', 'Loads 11 sample destinations.'],
    ], [0]),
    h2('2.2 Data model'),
    table([1900, 1500, 5960], ['Field', 'Type', 'Rules'], [
      ['name', 'String', 'Required, 2-100 characters, unique (case-insensitive)'],
      ['location', 'String', 'Required'],
      ['category', 'String', 'Required; Beach, Hill Station, Heritage, Adventure, Wildlife, Spiritual or City'],
      ['price', 'Number', 'Required, 0 or more'],
      ['rating', 'Number', '0 to 5, default 0'],
      ['duration', 'Number', 'Days, 1 or more, default 3'],
      ['bestSeason, description', 'String', 'Optional text'],
      ['createdAt, updatedAt', 'Date', 'Added automatically (timestamps)'],
    ], [0]),
    h2('2.3 Mongoose methods used'),
    table([2400, 3300, 3660], ['Method', 'Purpose', 'Endpoint'], methods, [0]),
  );

  /* ---------- 3 Setup ---------- */
  children.push(
    h1('3. Database Connection and Setup'),
    p('config/db.js reads MONGO_URI from the .env file and connects with Mongoose. If the connection fails the process exits with a clear message.'),
    ...code(read('config/db.js')),
    spacer(),
    h2('3.1 Running the project'),
    ...code('npm install\ncp .env.example .env     # MONGO_URI=mongodb://127.0.0.1:27017/destiny_travels\nnpm run dev             # http://localhost:5000\nnpm run seed            # optional: load 11 sample destinations'),
    spacer(),
    p('Expected console output on a successful start:'),
    ...code('MongoDB connected: 127.0.0.1/destiny_travels\nServer running on http://localhost:5000'),
  );

  /* ---------- 4 Key code ---------- */
  children.push(
    h1('4. Implementation Highlights'),
    h2('4.1 Model'), ...code(read('models/Destination.js')), spacer(),
    h2('4.2 Routes'), ...code(read('routes/destinationRoutes.js')), spacer(),
    p('Fixed paths such as /bulk, /discover and /categories are declared before /:id, otherwise Express would read them as an ID.'),
    h2('4.3 Smart discovery controller'),
    ...code(read('controllers/destinationController.js').match(/\/\/ GET \/api\/destinations\/discover[\s\S]*?\n\}\);\n/)[0].trim()),
    spacer(),
    p('Sorting always ends with _id so two documents with equal price never swap places between pages. The list query and countDocuments() run in parallel with the same filter, so total and totalPages match the data.'),
  );

  /* ---------- 5 Testing ---------- */
  children.push(
    h1('5. API Testing with Postman'),
    p('The collection postman/Destiny_Travels_API.postman_collection.json holds 19 requests in six folders. Each has a test script that checks the status code and the success flag. Request 01 stores the new _id in the destinationId variable for requests 04, 06 and 12.'),
    p('Run the requests in order, starting from an empty collection (npm run seed:destroy).'),
  );
  for (const ch of challenges) {
    children.push(h2(`5.${ch.key} ${ch.title.replace(/^Challenge \d+: /, ch.key === 6 ? '' : '')}`));
    for (const it of items.filter((x) => x.challenge === ch.key)) {
      const real = path.join(__dirname, 'screenshots', it.id + '.png');
      const prev = path.join(__dirname, 'screenshots', 'preview', it.id + '.png');
      const isLive = fs.existsSync(real);
      (isLive ? live : sample).push(it.id);
      children.push(
        new Paragraph({ keepNext: true, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: `${it.id.slice(0, 2)}. ${it.title}`, bold: true, size: 24, color: NAVY, font: FONT })] }),
        table([1500, 7860], ['Item', 'Detail'], [
          ['Request', `${it.method} ${it.route}${queryString(it.query)}`],
          ...(it.mongoose ? [['Mongoose', it.mongoose]] : []),
          ['Expected status', `${it.status}`],
          ['Purpose', it.purpose],
        ], [1]),
        spacer(),
        ...(await image(isLive ? real : prev, 560, 560, `Figure: ${it.id}${isLive ? ' (Postman screenshot)' : ' (sample output, not a live capture)'}`)),
      );
    }
  }

  /* ---------- 6 Error handling ---------- */
  children.push(
    h1('6. Error Handling and Status Codes'),
    table([1100, 2600, 5660], ['Status', 'Meaning', 'Triggered by'], [
      ['200', 'OK', 'Successful read, update or delete'],
      ['201', 'Created', 'create() or insertMany() succeeded'],
      ['400', 'Bad Request', 'Malformed ID, validation failure, bad query value, empty update, bulk delete with no condition'],
      ['404', 'Not Found', 'No document matches, or unknown route'],
      ['409', 'Conflict', 'Duplicate destination name (unique index)'],
      ['500', 'Server Error', 'Unexpected failure; details hidden in production'],
    ]),
    spacer(),
    ...code(read('middleware/errorHandler.js')),
  );

  /* ---------- 7 Conclusion ---------- */
  children.push(
    h1('7. Conclusion'),
    p('The Destiny Travels API covers all five challenges: adding, retrieving, updating, discovering and deleting destinations. It uses 15 distinct Mongoose methods, a clean MVC layout, input validation, safe bulk delete, and consistent JSON errors with correct HTTP status codes.'),
    h2('Possible next steps'),
    bullet('Add user authentication and role-based access for write operations.'),
    bullet('Add text search on name and description.'),
    bullet('Add automated tests with Jest and Supertest.'),
  );

  const doc = new Document({
    creator: 'Destiny Travels', title: 'Destiny Travels API - Project Report',
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 34, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 27, bold: true, color: ACCENT }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } },
      ],
    },
    numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1300, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFC7D1', space: 4 } }, children: [new TextRun({ text: 'Destiny Travels API  |  Project Report', size: 18, color: GREY, font: FONT })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', size: 18, color: GREY, font: FONT }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GREY, font: FONT })] })] }) },
      children,
    }],
  });
  const out = path.join(__dirname, 'Destiny_Travels_API_Report.docx');
  fs.writeFileSync(out, await Packer.toBuffer(doc));
  console.log(`Report written: ${out}\n  real Postman screenshots: ${live.length}\n  sample panels: ${sample.length}`);
})();
