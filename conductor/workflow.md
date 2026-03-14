# Workflow

## Development Methodology

### TDD Policy
**Level**: Moderate - Tests encouraged, not blocked

- Write tests for complex business logic and database operations
- Tests required for payment processing and order synchronization
- Unit tests for backend services (.NET)
- Integration tests for API endpoints

### Commit Strategy
**Style**: Conventional Commits

Format: `type(scope): description [track-id]`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build process, dependencies

Examples:
- `feat(api): add order synchronization endpoint [order-sync-2024]`
- `fix(db): correct GST calculation for Maryland [tax-fix-2024]`
- `docs(readme): update deployment instructions`

### Code Review Requirements
**Policy**: Required for non-trivial changes

- All database schema changes require review
- Payment processing code requires review
- Configuration changes require review
- Small UI fixes can be self-reviewed

### Verification Checkpoints
**Timing**: After each phase completion

- Phase verification before moving to next phase
- Manual testing of order flow after implementation
- Database integrity checks after any DB operations

## Task Lifecycle

### Status Markers
- `[ ]` - Pending
- `[~]` - In Progress
- `[x]` - Complete
- `[!]` - Blocked

### Phase Structure
Each track has multiple phases:
1. **Phase 1**: Setup and foundation
2. **Phase 2**: Core implementation
3. **Phase 3**: Integration and testing
4. **Phase 4**: Deployment and verification

### Phase Verification Checklist
Before marking a phase complete:
- [ ] All tasks in phase are complete
- [ ] Code compiles without errors
- [ ] Tests pass (if applicable)
- [ ] Manual verification complete
- [ ] Documentation updated

## Git Workflow

### Branch Naming
- Feature: `feature/{track-id}/{short-description}`
- Bug fix: `fix/{track-id}/{short-description}`
- Hotfix: `hotfix/{description}`

### Commit Messages
Include track ID in commits related to a track:
```
feat(api): add payment tokenization endpoint [payment-2024]

- Implement Authorize.net Accept.js integration
- Add token storage to tblPayment
- Update tests
```

### Pull Requests
- Link to track in PR description
- Include test results
- List verification steps performed

## Safety Rules

### Database Safety
- All DB writes must be atomic (BEGIN TRANSACTION / COMMIT)
- Use UPDLOCK for concurrent access scenarios
- Never trust client-submitted prices - re-validate from tblAvailableSize server-side
- Partial writes corrupt the live POS - prevent at all costs

### Payment Safety
- Tokenization only via Authorize.net Accept.js
- Never store raw card data
- Log payment attempts but mask sensitive data

### POS Integration Safety
- No schema changes to INI_Restaurant/TPPro database
- Read POS tax rates live from tblMisc (don't hardcode)
- OnlineItem=0 for all items - restaurant must enable before go-live

## Release Process

### Milestone Acceptance
1. Client written acceptance required
2. Upload to S3 (GitHub alone is NOT sufficient)
3. Milestone payment released only after both above

### Deployment Checklist
- [ ] All tests passing
- [ ] Database migrations tested (if applicable)
- [ ] Configuration files updated
- [ ] S3 upload complete
- [ ] Client acceptance received
