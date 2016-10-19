stops.csv:
	j stops.xlsx | sed 's/^,,,.*$$//' | grep -v '^$$' > stops.csv
stops.json: stops.csv
	cat $< | csvgrep -c1 -r '^[0-9]' | csv2json > stops.json
	jq '.' $@ | sponge $@

md:
	jq -c '.[] | select(."Stop #" != "")' stops.json | while read json; do \
		stop=$$(jq -r '."Stop #"' <<<$$json); \
		parentStop=$$(echo $$stop | sed 's/[ABC]//'); \
		substops=$$(jq -r 'map(."Stop #")[]' stops.json \
		| grep "^$$parentStop[ABC]" \
		| tr '\n' ',' \
		| sed 's/,$$//'); \
		stopJson=$$(jq --arg substops "$$substops" --arg parent $$parentStop '{ \
			layout: "episode", \
	    type: "stop", \
	  	section_title: .CONTENT, \
			title: .CONTENT, \
			stop_id: ."Stop #", \
			permalink: ("/stops/" + ."Stop #"), \
			audio_file: (."Stop #" + ".mp3"), \
			parent_stop: $$parent, \
			substops: ($$substops | split(",")), \
		}' <<<$$json); \
		echo $$stopJson | json2yaml \
    | gsed 's/audio_file: \([1-9]\)/audio_file: 0\1/' \
    > $$stop.md; \
		echo '---\n' >> $$stop.md; \
	done;
