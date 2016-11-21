tours = delacroix matisse
buildTours:
	for tour in $(tours); do make buildTour tour=$$tour; done

tour = delacroix
template = static-museum-audio-guide
buildTour:
	mergedConfig=$$(ruby -r yaml -e " \
		puts Dir.glob('{$(tour),static-museum-audio-guide}/_config.yml') \
		.map {|f| YAML.parse(File.read(f)).to_ruby } \
		.reverse \
		.reduce({}, :merge) \
		.to_yaml \
	"); \
	cd $(template); \
		rm -rf audio stops; \
		ln -s ../mp3s/$(tour) audio; \
		ln -s ../$(tour) stops; \
		echo "$$mergedConfig" > _config.yml; \
		jekyll build; \
		git checkout _config.yml
	rsync -avz $(template)/_site/ _site/$(tour)

deploy:
	rsync -avz _site/ new:/var/www/audio-tours/

id3tags:
	ls luther/*.md | grep -v 'index\|preview' | while read file; do \
		json=$$(m2j $$file | jq 'to_entries[0].value'); \
		title=$$(jq '.section_title' <<<$$json); \
		speakers=$$(cat $$file | grep '^##' | sed 's/## //' | sort | uniq | tr '\n' ';' | sed 's/;$$//; s/;/, /'); \
		mp3File=$$(echo mp3s/luther-tagged/$$(basename $$file .md).mp3 | gsed -r 's|/(.[ABC]?)\.mp3|/0\1.mp3|'); \
		id3tool \
		  -t "$$title" \
			-r "$$speakers" \
			-a "Martin Luther Audio Guide | Minneapolis Institute of Art" \
			$$mp3File; \
	done
