# Contributing to Nstyle

First off, thank you for considering contributing to Nstyle! It's people like you that make Nstyle such a great tool for the nail art community.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Include mockups or wireframes if applicable**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these issues:

- `good first issue` - issues which should only require a few lines of code
- `help wanted` - issues which should be a bit more involved than beginner issues

### Pull Requests

1. **Fork the repo and create your branch from `main`**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Ensure the test suite passes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
   
   Follow our commit message conventions:
   - Use the present tense ("Add feature" not "Added feature")
   - Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
   - Limit the first line to 72 characters or less
   - Reference issues and pull requests liberally after the first line

5. **Push to your fork**
   ```bash
   git push origin feature/AmazingFeature
   ```

6. **Open a Pull Request**
   - Provide a clear title and description
   - Link any relevant issues
   - Include screenshots for UI changes

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - npm or bun
   - Git
   - Supabase account

2. **Local Development**
   ```bash
   # Clone your fork
   git clone https://github.com/your-username/nstyle.git
   cd nstyle

   # Install dependencies
   npm install

   # Copy environment variables
   cp .env.example .env

   # Start development server
   npm run dev
   ```

3. **Running Tests**
   ```bash
   # Run all tests
   npm run test

   # Run tests in watch mode
   npm run test:watch

   # Run linting
   npm run lint

   # Type checking
   npm run type-check
   ```

## Style Guidelines

### TypeScript Style Guide

- Use TypeScript for all new code
- Define types/interfaces for all props and function parameters
- Avoid using `any` type
- Use meaningful variable and function names
- Keep functions small and focused

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use proper prop typing with TypeScript interfaces
- Place reusable components in `src/components/ui`
- Feature-specific components go in their respective folders

### CSS/Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the existing design system
- Use CSS modules for component-specific styles when needed
- Keep responsive design in mind
- Test on both light and dark themes

## Project Structure

```
src/
├── components/      # Reusable components
│   ├── ui/         # Base UI components
│   └── ...         # Feature-specific components
├── pages/          # Route pages
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── services/       # API services
└── integrations/   # External integrations
```

## Testing

- Write tests for new features
- Update tests when modifying existing features
- Aim for good test coverage
- Use descriptive test names
- Test both success and error cases

## Documentation

- Update README.md if needed
- Document new features
- Add JSDoc comments for complex functions
- Update API documentation for backend changes
- Include inline comments for complex logic

## Questions?

Feel free to open an issue with the tag `question` or reach out to the maintainers.

## Recognition

Contributors will be recognized in our README and release notes. We appreciate every contribution, no matter how small!

Thank you for contributing to Nstyle! 🎨💅