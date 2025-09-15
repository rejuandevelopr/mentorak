# Project Structure

## Directory Organization


## Folder Conventions

- `app/` = Routes for core pages
- `components/` = Reusable components
- `lib/` = Business logic and APIs
- `types/` = Shared types across the app

## File Naming Conventions

- camelCase for variables/functions
- PascalCase for components
- kebab-case for filenames

## Code Organization Principles

- Keep business logic (`pdf`, `openai`, `voice`) inside `lib/`
- UI should remain dumb/pure components in `components/`
- Maintain separation between API logic and UI rendering
