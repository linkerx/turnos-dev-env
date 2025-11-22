# Makefile for turnos-dev-env
# Based on guidelines: dev-env.md

.PHONY: help init up down logs restart clean build ps

help: ## Show this help message
	@echo "Turnos Development Environment"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Initialize the project (first time setup)
	@echo "Initializing turnos-dev-env..."
	@if [ ! -f .env ]; then cp config/env.example .env; echo "Created .env file from env.example"; fi
	@mkdir -p data/postgres data/pgadmin
	@echo "Installing dependencies for turnos-api..."
	@cd src/turnos-api && npm install
	@echo "Setup complete! Run 'make up' to start the services."

up: ## Start all services
	docker-compose up -d
	@echo "Services started. API available at http://localhost:3000/api"
	@echo "Swagger docs at http://localhost:3000/api/docs"

up-tools: ## Start all services including tools (pgAdmin)
	docker-compose --profile tools up -d
	@echo "Services started with tools."
	@echo "API: http://localhost:3000/api"
	@echo "Swagger: http://localhost:3000/api/docs"
	@echo "pgAdmin: http://localhost:5050"

down: ## Stop all services
	docker-compose down

down-volumes: ## Stop all services and remove volumes (WARNING: deletes data)
	docker-compose down -v
	@echo "WARNING: All volumes have been removed!"

logs: ## Show logs from all services
	docker-compose logs -f

logs-api: ## Show logs from API service only
	docker-compose logs -f turnos-api

restart: ## Restart all services
	docker-compose restart

restart-api: ## Restart API service only
	docker-compose restart turnos-api

build: ## Rebuild all Docker images
	docker-compose build

build-api: ## Rebuild API Docker image
	docker-compose build turnos-api

ps: ## Show running containers
	docker-compose ps

clean: ## Clean up containers, networks, and images (keeps volumes)
	docker-compose down
	docker-compose rm -f
	@echo "Cleaned up containers and networks"

shell-api: ## Open a shell in the API container
	docker-compose exec turnos-api sh

shell-db: ## Open a psql shell in the database
	docker-compose exec postgres psql -U postgres -d turnos_db

backup-db: ## Backup the database
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres turnos_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backups/"

restore-db: ## Restore the database (use BACKUP=filename)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make restore-db BACKUP=backup_20240115_120000.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U postgres turnos_db < backups/$(BACKUP)
	@echo "Database restored from $(BACKUP)"

dev-api: ## Run API in development mode locally (without Docker)
	cd src/turnos-api && npm run start:dev

install-api: ## Install API dependencies
	cd src/turnos-api && npm install

test-api: ## Run API tests
	cd src/turnos-api && npm run test

lint-api: ## Lint API code
	cd src/turnos-api && npm run lint

format-api: ## Format API code
	cd src/turnos-api && npm run format
