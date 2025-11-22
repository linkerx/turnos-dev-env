# Makefile for turnos-api microservice
# Based on guidelines: service.md

# Variables
IMAGE_NAME = turnos-api
REGISTRY = localhost:5000
TAG ?= latest

.PHONY: help build build-push clean

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(TAG) .
	@echo "Image built: $(IMAGE_NAME):$(TAG)"

build-push: build ## Build and push Docker image to registry
	docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	docker push $(REGISTRY)/$(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo "Image pushed: $(REGISTRY)/$(IMAGE_NAME):$(TAG)"

clean: ## Remove built Docker images
	docker rmi $(IMAGE_NAME):$(TAG) || true
	@echo "Cleaned up images"

install: ## Install dependencies
	npm install

dev: ## Run in development mode
	npm run start:dev

test: ## Run tests
	npm run test

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format
