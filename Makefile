.PHONY: install-backend install-frontend install start-backend start-frontend start clean

# Python virtual environment setting
VENV_DIR = api/venv
PYTHON = $(VENV_DIR)/bin/python
PIP = $(VENV_DIR)/bin/pip

install-backend:
	cd api && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

install-frontend:
	cd app && npm install

check-system-deps:
	@which ffmpeg > /dev/null || (echo "Error: ffmpeg is not installed. Please install it (e.g., 'brew install ffmpeg') before proceeding." && exit 1)
	@echo "ffmpeg found."

install: check-system-deps install-backend install-frontend

start-backend:
	cd api && ./venv/bin/python main.py

start-frontend:
	cd app && npm run electron-dev

# Start both in parallel (requires make -j2 or similar, but simplified here to just backend instructions or sequential)
# Realistically, users want two terminals. This target just reminds them.
start:
	@echo "Please run 'make start-backend' in one terminal and 'make start-frontend' in another."

clean:
	rm -rf $(VENV_DIR)
	rm -rf app/node_modules
