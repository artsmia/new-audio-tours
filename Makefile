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
	rsync -avz _site/ staging:/var/www/audio/
