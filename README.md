# Math Tutor App

A modern, interactive web application designed to help students master mathematical concepts through personalized learning paths, video tutorials, and practice exercises. Built with Next.js, TypeScript, and Tailwind CSS.

![Math Tutor App Screenshot](/public/screenshot.png)

## Features

- **Personalized Learning Paths**: Adaptive learning based on user knowledge gaps
- **Interactive Lessons**: Engaging content with video tutorials and practice problems
- **Progress Tracking**: Monitor your learning journey and track improvements
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Eye-friendly dark theme for comfortable learning
- **Video Integration**: Direct access to educational content

## Tech Stack

- **Frontend**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks & Context API
- **Type Safety**: TypeScript
- **Build Tool**: Turbopack
- **Deployment**: Vercel

## Prerequisites

- Node.js 18.0.0 or later
- npm, yarn, or pnpm
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Boweii22/Math-Tutor-App-Pattern-Algorithm.git
cd math-tutor-app
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# API Keys (if any)
NEXT_PUBLIC_API_URL=your_api_url_here
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
math-tutor-app/
├── src/
│   ├── app/                 # App Router pages and layouts
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and data
│   └── styles/              # Global styles and Tailwind config
├── public/                  # Static assets
└── tests/                   # Test files
```

## Available Scripts

- `dev`: Start development server
- `build`: Build the application for production
- `start`: Start production server
- `lint`: Run ESLint
- `test`: Run tests
- `format`: Format code with Prettier

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Bowei - [@your_twitter](https://twitter.com/your_handle)

Project Link: [https://github.com/Boweii22/Math-Tutor-App-Pattern-Algorithm](https://github.com/Boweii22/Math-Tutor-App-Pattern-Algorithm)

## Acknowledgements

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Vercel](https://vercel.com)
