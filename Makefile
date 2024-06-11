.DEFAULT_GOAL := build

server:
	docker run --rm -it -v ./:/usr/src/app -p 4000:4000 -p 35729:35729 tech-conferences-spain-app bundle exec jekyll serve
