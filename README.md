<div align="center">

# ✈️ Destiny Travels API

**Discover, organize, and manage travel destinations through a RESTful API.**

Built with Express.js, MongoDB, and Mongoose using a clean MVC structure.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![REST API](https://img.shields.io/badge/API-REST-blue)](#api-at-a-glance)

</div>

---

## 🌍 About

Destiny Travels API is a Node.js service for managing travel destinations. It provides endpoints to create, retrieve, update, filter, sort, paginate, and delete destination records stored in MongoDB.

| | |
|---|---|
| **Database** | `destiny_travels` |
| **Collection** | `destinations` |
| **API base path** | `/api/destinations` |
| **Sample records** | 11 destinations across 7 categories |

## ✨ Features

- Full destination CRUD, including bulk create and guarded bulk delete
- Smart discovery with category, price, and rating filters
- Flexible sorting and page-based pagination
- Case-insensitive unique destination names
- Centralized validation and error responses
- Ready-to-import Postman collection with request tests
- Optional sample-data seeder and generated API report

## 🧰 Tech stack

- **Runtime:** Node.js 18+
- **Web framework:** Express 4
- **Database:** MongoDB with Mongoose 8
- **Middleware:** CORS, Morgan, dotenv
- **API testing:** Postman

## 🚀 Get started

### Prerequisites

- Node.js 18 or later
- MongoDB Community Server running locally, or a MongoDB Atlas cluster

### Install and configure

```bash
git clone https://github.com/sariyaAnjum/Destiny_Travells-.git
cd Destiny_Travells-
npm install
```

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use `cp .env.example .env`.

The sample configuration uses a local MongoDB instance at `mongodb://127.0.0.1:27017/destiny_travels`. To use Atlas, set `MONGO_URI` in your local `.env` to your own connection string. **Do not commit `.env` or share database credentials.**

### Run the API

```bash
npm run dev
```

The development server starts at `http://localhost:5000`. For a regular start without auto-reload:

```bash
npm start
```

Check that the server is running by opening `http://localhost:5000/`.

### Load sample destinations

```bash
npm run seed
```

> **Warning:** `npm run seed` clears the current `destinations` collection before inserting the 11 sample records. To clear the collection without reseeding, use `npm run seed:destroy`.

## 🗺️ API at a glance

Base URL: `http://localhost:5000/api/destinations`

| Method | Endpoint | Purpose |
|:---:|---|---|
| `POST` | `/` | Create one destination |
| `POST` | `/bulk` | Create multiple destinations |
| `GET` | `/` | List all destinations |
| `GET` | `/:id` | Get a destination by MongoDB ID |
| `GET` | `/name/:name` | Get a destination by name |
| `PUT` | `/:id` | Update a destination by ID |
| `PUT` | `/name/:name` | Update a destination by name |
| `GET` | `/discover` | Filter, sort, and paginate destinations |
| `GET` | `/categories` | List distinct categories |
| `GET` | `/count` | Count matching destinations |
| `DELETE` | `/:id` | Delete a destination by ID |
| `DELETE` | `/name/:name` | Delete a destination by name |
| `DELETE` | `/bulk` | Delete matching destinations |

### Smart discovery

`GET /discover` accepts these query parameters:

| Parameter | Description |
|---|---|
| `category` | Filter by category (case-insensitive) |
| `minPrice`, `maxPrice` | Inclusive price range |
| `minRating`, `maxRating` | Inclusive rating range |
| `sort` | Comma-separated fields; prefix a field with `-` for descending order |
| `page` | Page number; defaults to `1` |
| `limit` | Results per page; defaults to `5`, maximum `50` |

Example:

```http
GET /api/destinations/discover?category=Beach&minPrice=5000&maxPrice=20000&sort=price,-rating&page=1&limit=5
```

Sortable fields: `price`, `rating`, `name`, `duration`, and `createdAt`.

Bulk deletion requires at least one filter (`category`, price, or rating), preventing an accidental unfiltered delete.

### Example response

```json
{
  "success": true,
  "data": {
    "_id": "…",
    "name": "Goa Beaches",
    "location": "Goa, India",
    "category": "Beach",
    "price": 12000,
    "rating": 4.5,
    "duration": 4
  }
}
```

Errors use a consistent response shape:

```json
{
  "success": false,
  "message": "Destination not found"
}
```

Common status codes: `200` success, `201` created, `400` invalid input, `404` not found, `409` duplicate destination, and `500` unexpected server error.

## 🧪 Test with Postman

1. Import [`postman/Destiny_Travels_API.postman_collection.json`](./postman/Destiny_Travels_API.postman_collection.json) into Postman.
2. Start the API and make sure its `baseUrl` collection variable points to `http://localhost:5000`.
3. Use a clean database (`npm run seed:destroy`) before running the collection; its bulk-insert request adds the sample destinations.
4. Run the requests in order, or use Postman's Collection Runner. The requests include tests and share the created destination ID where needed.

## 📁 Project structure

```text
.
├── config/                 MongoDB connection
├── controllers/            Destination business logic
├── data/                   11 sample destinations
├── docs/                   API specification, report tools, diagrams, screenshots
├── middleware/             404 handling and centralized errors
├── models/                 Mongoose destination schema and indexes
├── postman/                Importable Postman collection
├── routes/                 Destination API routes
├── utils/                  Shared API error type
├── seeder.js               Sample-data commands
└── server.js               Application entry point
```

## 📄 API report

The project includes a Word report and the source materials used to build it under `docs/`. Regenerate the report with:

```bash
npm run report
```

## 📜 Available scripts

| Command | Description |
|---|---|
| `npm start` | Start the API |
| `npm run dev` | Start with Nodemon |
| `npm run seed` | Clear the collection and insert sample destinations |
| `npm run seed:destroy` | Clear the collection |
| `npm run report` | Generate the Word API report |

---

<div align="center">

Made for curious travelers and builders. 🌏

</div>
