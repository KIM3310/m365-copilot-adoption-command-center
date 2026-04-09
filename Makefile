.PHONY: backend frontend test build docker

backend:
	python3 -m venv .venv
	. .venv/bin/activate && pip install '.[dev]' && uvicorn backend.app.main:app --reload

frontend:
	npm install
	npm run dev

test:
	. .venv/bin/activate && pytest

build:
	npm run build

docker:
	docker compose up --build

