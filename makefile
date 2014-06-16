PYTHON=python
TOOLS=tools
SHELL=sh

all: deps dataDeps testDeps

deps:
	$(PYTHON) $(TOOLS)/generateDeps.py engine/ > engine/deps.json

dataDeps:
	$(PYTHON) $(TOOLS)/generateDeps.py data/ > data/deps.json
	
testDeps:
	$(PYTHON) $(TOOLS)/generateDeps.py tests/ > tests/deps.json	

document:
	$(SHELL) $(TOOLS)/document.sh

documentPrivate:
	$(SHELL) $(TOOLS)/document.sh -p

clean:
	rm -rf data/deps.json engine/deps.json tests/deps.json doc/*
