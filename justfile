# Justfile for Kristian Garza Portfolio (11ty)

# Default recipe - show available commands
default:
    @just --list

# Install dependencies
install:
    bun install

# Build the site for production
build:
    bun run build

# Start development server with live reload
dev:
    bun run dev

# Watch for changes and rebuild
watch:
    bun run watch

# Build for GitHub Pages deployment
build-ghpages:
    bun run build-ghpages

# Clean build artifacts and dependencies
clean:
    rm -rf _site node_modules

# Clean and reinstall dependencies
reinstall: clean install

# Deploy the /ask/ endpoint (Cloudflare Worker; needs wrangler login)
deploy-ask:
    cd worker/ask && bunx wrangler deploy

# Serve the built site locally (without rebuilding)
serve:
    cd _site && python3 -m http.server 8080

# Check for outdated dependencies
check-updates:
    bun outdated

# Update dependencies
update:
    bun update

# Run every test: site SEO + CV render (bun), job-pipeline scripts (pytest)
test: test-scripts
    bun test tests/

# Job-pipeline script tests only (fast, offline, no site build)
test-scripts:
    uvx pytest

# Run a quick lint/check on the project, then the tests
check: test
    @echo "Checking project structure..."
    @test -f package.json && echo "✓ package.json found" || echo "✗ package.json missing"
    @test -d src && echo "✓ src directory found" || echo "✗ src directory missing"
    @test -f .eleventy.js && echo "✓ .eleventy.js found" || echo "⚠ .eleventy.js not found (using defaults)"

# Deploy to GitHub Pages (build and push)
deploy: build-ghpages
    @echo "Built site in _site directory"
    @echo "Deploy to GitHub Pages by committing and pushing the _site directory"
    @echo "or configure GitHub Actions for automatic deployment"

# Create a new work item (example for extending)
new-work NAME:
    @echo "Creating new work item: {{NAME}}"
    @mkdir -p src/work/{{NAME}}
    @echo "Created directory src/work/{{NAME}}"

# Format/prettify code (if you add prettier later)
format:
    @echo "No formatter configured yet. Consider adding prettier."
