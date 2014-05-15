PYTHON=python
TOOLS=Tools
SHELL=sh

all: deps dataDeps

deps:
	$(PYTHON) $(TOOLS)/generateDeps.py DuskWolf/ > DuskWolf/deps.json

dataDeps:
	$(PYTHON) $(TOOLS)/generateDeps.py Data/ > Data/deps.json

document:
	$(SHELL) $(TOOLS)/document.sh

documentPrivate:
	$(SHELL) $(TOOLS)/document.sh -p

clean:
	rm -rf Data/deps.json DuskWolf/deps.json Doc/*
