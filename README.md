# DocDefend MVP

**Clinical Documentation Defensibility QA Platform powered by Claude AI**

DocDefend is a full-stack web application that helps healthcare organizations analyze and strengthen the defensibility of clinical documentation. By leveraging Claude AI, it performs automated quality assurance checks to identify gaps, inconsistencies, and compliance risks in clinical notes — reducing audit exposure and supporting better patient outcomes.

🔗 **Live Demo:** [docdefend-mvp.vercel.app](https://docdefend-mvp.vercel.app)

---

## Features

- **AI-Powered QA Analysis** — Submits clinical documents to Claude AI for comprehensive defensibility review, flagging documentation gaps, vague language, and unsupported clinical assertions.
- **Compliance Awareness** — Built with HIPAA considerations in mind (see [HIPAA_COMPLIANCE.md](./HIPAA_COMPLIANCE.md)).
- **Document Upload Support** — Accepts clinical documentation files via the client interface, with sample files included for quick testing.
- **REST API Backend** — Clean separation between the Express/Node.js server and client, with a dedicated `/api` layer optimized for Vercel serverless deployment.
- **Responsive Client UI** — JavaScript-based frontend with a straightforward interface for uploading and reviewing documentation analysis results.

---

## Project Structure

```
docdefend-mvp/
├── api/              # Vercel serverless API functions
├── client/           # Frontend application (HTML/CSS/JS)
├── server/           # Express backend server
├── sample-files/     # Example clinical documents for testing
├── .env.example      # Environment variable template
├── HIPAA_COMPLIANCE.md
├── vercel.json       # Vercel deployment configuration
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/aabdur1/docdefend-mvp.git
cd docdefend-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Running Locally

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Deployment

This project is configured for **Vercel** deployment out of the box.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Set your `ANTHROPIC_API_KEY` in the Vercel project environment variables dashboard before deploying.

---

## HIPAA Compliance

DocDefend is designed with HIPAA considerations in mind. Please review [HIPAA_COMPLIANCE.md](./HIPAA_COMPLIANCE.md) for details on data handling, what PHI protections are in place, and your responsibilities as an operator before using this platform in a production healthcare environment.

> **Note:** This MVP is intended for demonstration and development purposes. A formal HIPAA risk assessment and Business Associate Agreement (BAA) with Anthropic are required before processing real patient data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| AI Engine | Anthropic Claude API |
| Deployment | Vercel (serverless) |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

This project is currently unlicensed. Contact the repository owner for usage permissions.
