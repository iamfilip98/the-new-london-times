# Claude Code Configuration

## Post-Change Actions
After making any code changes, Claude should:
1. Run any available lint/typecheck commands
2. Verify the fix before saying it's done
3. If the fix is for mobile display, test it as iPhone 12 Pro
4. Commit changes with a meaningful message
5. Push to git

## Available Commands
- `npm run dev` - Start development server
- Open index.html directly in browser for testing
- No lint/typecheck commands available

## Git Workflow
- Always commit with descriptive messages
- Push changes after committing
- Follow conventional commit format when possible