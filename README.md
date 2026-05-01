# Cartoon Care

AI-powered system that generates personalized illustrated medical storybooks for children.

## Project Overview

Cartoon Care helps children aged 5-11 understand medical conditions through engaging, personalized storybooks with Disney-style illustrations. The system uses AI to generate stories where the child is the hero, making healthcare less intimidating.

## Features

- Personalized story generation with child as protagonist
- Disney-Pixar style AI-generated illustrations
- Support for 8 common pediatric conditions
- Multilingual support (English and Hindi)
- PDF export with optimized file sizes
- Text-to-speech read-aloud functionality
- Admin dashboard for content management

## Technology Stack

### Frontend
- React 18.2.0
- Tailwind CSS 3.4.0
- Vite 5.1.0
- Axios for API calls

### Backend
- FastAPI 0.111.0
- Python 3.10+
- SQLAlchemy 2.0.30
- SQLite database

### AI Models
- Ollama (LLaMA 3.1 8B) for story generation
- Stable Diffusion XL for image generation
- LoRA fine-tuning for style consistency
- Groq API for prompt engineering

## System Requirements

### Minimum
- Intel Core i5 8th Gen or AMD Ryzen 5
- 16 GB RAM
- NVIDIA GTX 1660 (6GB VRAM)
- 256 GB SSD
- 10 Mbps internet

### Recommended
- Intel Core i7 10th Gen or AMD Ryzen 7
- 32 GB RAM
- NVIDIA RTX 3060 (12GB VRAM)
- 512 GB NVMe SSD
- 50 Mbps internet

## Installation

### Prerequisites

1. Install Python 3.10 or higher
2. Install Node.js 18 or higher
3. Install Ollama from https://ollama.ai
4. Install NVIDIA drivers and CUDA toolkit (for GPU)

### Backend Setup

```bash
cd cartoon-care/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env and add your API keys
# GROQ_API_KEY=your_groq_api_key_here

# Download Ollama model
ollama pull llama3.1:8b

# Initialize database
python migrate.py

# Start backend server
python -m uvicorn app.main:app --reload
```

Backend will run at: http://localhost:8000

### Frontend Setup

```bash
cd cartoon-care/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Log in with your credentials
4. Click "Create New Story"
5. Fill in the form:
   - Child's name
   - Age (5-11)
   - Medical condition
   - Language (English/Hindi)
6. Click "Create My Storybook"
7. Wait 3-5 minutes for generation
8. View, read aloud, or download as PDF

## Project Structure

```
cartoon-care/
├── backend/
│   ├── ai/                    # AI models and training
│   │   ├── image_generator/   # Stable Diffusion integration
│   │   ├── lora_training/     # LoRA fine-tuning
│   │   └── prompt_builder/    # Prompt engineering
│   ├── app/                   # FastAPI application
│   ├── data/                  # SQLite database
│   ├── models/                # AI model weights (gitignored)
│   ├── outputs/               # Generated content (gitignored)
│   ├── routes/                # API endpoints
│   ├── services/              # Business logic
│   ├── .env.example           # Environment template
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   └── App.jsx           # Main app component
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
└── README.md                 # This file
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Configuration

### Environment Variables

Create `backend/.env` file with:

```env
# Database
DATABASE_URL=sqlite:///./data/cartoon_care.db

# JWT Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Models
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Stable Diffusion
SD_MODEL_PATH=./models/stable-diffusion-xl
LORA_WEIGHTS_PATH=./ai/lora_training/lora_weights.safetensors

# Output
OUTPUT_DIR=./outputs
```

## Development

### Running Tests

```bash
# Backend tests
cd cartoon-care/backend
pytest tests/

# Frontend tests
cd cartoon-care/frontend
npm run test
```

### Code Linting

```bash
# Backend
cd cartoon-care/backend
flake8 .

# Frontend
cd cartoon-care/frontend
npm run lint
```

### Building for Production

```bash
# Frontend build
cd cartoon-care/frontend
npm run build

# Output will be in frontend/dist/
```

## Deployment

### Local Deployment

1. Follow installation steps above
2. Configure production environment variables
3. Build frontend: `npm run build`
4. Serve frontend with Nginx or similar
5. Run backend with production ASGI server

### Cloud Deployment

Refer to deployment documentation for:
- AWS EC2 with GPU instances
- Google Cloud Platform
- Azure

## Troubleshooting

### Common Issues

**Issue: GPU out of memory**
- Solution: Reduce batch size or use smaller model

**Issue: Ollama not found**
- Solution: Install Ollama and ensure it's in PATH

**Issue: Story generation fails**
- Solution: Check Ollama is running: `ollama list`

**Issue: Images not generating**
- Solution: Verify GPU drivers and CUDA installation

**Issue: Hindi text shows as boxes in PDF**
- Solution: System will use Arial Unicode MS font automatically

## Contributing

This is an academic project. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Team

- **Saurabh Kumar** (2315510190)
- **Anushka Yadav** (2315510034)

**Mentor:** Mr. Shivanshu Upadhyay

**Institution:** GLA University, Mathura

## License

This project is developed as part of B.Tech final year project at GLA University.

## Acknowledgments

- Ollama for local LLM inference
- Stability AI for Stable Diffusion
- Hugging Face for model hosting
- Meta for LLaMA models
- Open-source community

## Contact

For questions or support:
- Email: saurabh.kumar@gla.ac.in
- Email: anushka.yadav@gla.ac.in

## Documentation

- **Final Report:** `Cartoon_Care_Final_Report.docx`
- **API Documentation:** http://localhost:8000/docs (when running)

## Version

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Status:** Production Ready
