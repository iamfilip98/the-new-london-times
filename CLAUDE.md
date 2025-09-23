# Claude Code Configuration

## Post-Change Actions
After making any code changes, Claude should:
1. Run any available lint/typecheck commands
2. Commit changes with a meaningful message
3. Push to git

## Available Commands
- `npm run lint` - Run linting
- `npm run typecheck` - Run type checking
- `npm test` - Run tests

## Git Workflow
- Always commit with descriptive messages
- Push changes after committing
- Follow conventional commit format when possible