# Justfile for Kristian Garza Portfolio (11ty)

# Default recipe - show available commands
default:
    @just --list

# Install dependencies
install:
    bun install

# Build the site for production. Theme: accent (default) or editorial, see src/_data/theme.js
build theme="accent":
    SITE_THEME={{theme}} bun run eleventy

# Start development server with live reload, e.g. `just dev editorial`
dev theme="accent":
    SITE_THEME={{theme}} bun run eleventy --serve

# Watch for changes and rebuild, e.g. `just watch editorial`
watch theme="accent":
    SITE_THEME={{theme}} bun run eleventy --watch

# Build for GitHub Pages deployment (CI sets SITE_THEME from a repository variable)
build-ghpages theme="accent":
    SITE_THEME={{theme}} bun x @11ty/eleventy

# Clean build artifacts and dependencies
clean:
    rm -rf _site node_modules

# Clean and reinstall dependencies
reinstall: clean install

# Serve the built site locally (without rebuilding)
serve:
    cd _site && python3 -m http.server 8080

# Check for outdated dependencies
check-updates:
    bun outdated

# Update dependencies
update:
    bun update

# Run every test: site SEO + CV render + themes (bun), job-pipeline scripts (pytest).
# The SEO and CV suites run once per theme; themes.test.js builds both itself.
test: test-scripts
    bun test tests/
    SITE_THEME=editorial bun test tests/seo.test.js tests/cv-to-pdf.test.js

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
