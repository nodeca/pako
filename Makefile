PATH        := ./node_modules/.bin:${PATH}

NPM_PACKAGE := $(shell node -e 'process.stdout.write(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'process.stdout.write(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut --bytes=-6) master)
GITHUB_PROJ := nodeca/${NPM_PACKAGE}


help:
	echo "make help       - Print this help"
	echo "make lint       - Lint sources with JSHint"
	echo "make publish    - Set new version tag and publish npm package"


lint:
	if test ! `which jshint` ; then \
		echo "You need 'jshint' installed in order to run lint." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	jshint . --show-non-errors


test: lint
	@if test ! `which mocha` ; then \
		echo "You need 'mocha' installed in order to run tests." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	mocha

cover:
	rm -rf cover
	istanbul cover node_modules/.bin/_mocha -- -t 30000 -R spec

doc:
	@if test ! `which ndoc` ; then \
		echo "You need 'ndoc' installed in order to generate docs." >&2 ; \
		echo "  $ npm install -g ndoc" >&2 ; \
		exit 128 ; \
		fi
	rm -rf ./doc
	ndoc --link-format "{package.homepage}/blob/${CURR_HEAD}/{file}#L{line}"


browserify:
	if test ! `which browserify` ; then npm install browserify ; fi
	if test ! `which uglifyjs` ; then npm install uglify-js ; fi
	# Browserify
	( echo -n "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" ; \
		browserify -r ./ -s pako \
		) > dist/pako.js
	( echo -n "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" ; \
		browserify -r ./lib/deflate.js -s pako \
		) > dist/pako_deflate.js
	( echo -n "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" ; \
		browserify -r ./lib/inflate.js -s pako \
		) > dist/pako_inflate.js
	# Minify
	uglifyjs dist/pako.js -c -m \
		--preamble "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" \
		> dist/pako.min.js
	uglifyjs dist/pako_deflate.js -c -m \
		--preamble "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" \
		> dist/pako_deflate.min.js
	uglifyjs dist/pako_inflate.js -c -m \
		--preamble "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" \
		> dist/pako_inflate.min.js
	# Update bower package
	sed -i -r -e \
		"s/(\"version\":\s*)\"[0-9]+[.][0-9]+[.][0-9]+\"/\1\"${NPM_VERSION}\"/" \
		bower.json

dev-deps:
	@if test ! `which npm` ; then \
		echo "You need 'npm' installed." >&2 ; \
		echo "  See: http://npmjs.org/" >&2 ; \
		exit 128 ; \
		fi
	npm install -g jshint
	npm install


gh-pages:
	@if test -z ${REMOTE_REPO} ; then \
		echo 'Remote repo URL not found' >&2 ; \
		exit 128 ; \
		fi
	$(MAKE) doc && \
		cp -r ./doc ${TMP_PATH} && \
		touch ${TMP_PATH}/.nojekyll
	cd ${TMP_PATH} && \
		git init && \
		git add . && \
		git commit -q -m 'Recreated docs'
	cd ${TMP_PATH} && \
		git remote add remote ${REMOTE_REPO} && \
		git push --force remote +master:gh-pages
	rm -rf ${TMP_PATH}


publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm publish https://github.com/${GITHUB_PROJ}/tarball/${NPM_VERSION}


.PHONY: publish lint doc
.SILENT: help lint
