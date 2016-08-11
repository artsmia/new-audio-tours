/*
 * port unwieldly, single-file audio guide markdown files to a
 * one-file-per-stop approach.
 */
var fs = require('fs')
var path = require('path')
var R = require('ramda')
var m2j = require('markdown-to-json-with-content')

// What tour name are we processing?
var tourName = 'delacroix'
// Where is the old markdown file?
var tourPath = path.join(__dirname, '../old-tour-files', tourName+".md")
// Where is the transcript file, converted to markdown?
var transcriptPath = path.join(__dirname, '../transcripts', tourName+".md")

// Read and parse the files
var tourFile = fs.readFileSync(tourPath, 'utf-8')
var transcript = fs.readFileSync(transcriptPath, 'utf-8')
var json = JSON.parse(m2j.parse([tourFile], {width: 100, content: tourFile}))[0]

// re-shape the tour json
var tour = Object.keys(json).map(function(key) {
  return json[key]
})[0]

// Break the transcript up by stop number, accenting the person speaking with `##`
//     ('Patrick Noon:' -> '## Patrick Noon\n\n')
var matchName = /^(([\w+|\s]+){2,4}):(.*)$/gm
var transcriptWithSpeakers = R.splitEvery(2, transcript.split('**').splice(1))
.reduce(function(dict, [stop, transcript]) {
  dict[stop] = transcript.replace(matchName, function(match, person, _, words, offset, string) {
    return `## ${person.trim()}\n\n${words.trim()}\n\n`
  })
  return dict
}, {})

// Create and write a markdown file for each stop with metadata front-matter
// and the transcript
tour.stops.forEach(function(mainStop) {
  var colors = Object.keys(mainStop.colors)
  .map(function(key) {
    var colorStop = mainStop.colors[key]
    colorStop.parentStop = mainStop
    colorStop.color = key
    return colorStop
  })
  var stops = [mainStop].concat(colors)

  stops.forEach(function(stop) {
    var file = stop.id || stop.file.replace(/^00?/, '')
    var frontMatter = `---
layout: episode
permalink: /stops/${file}
type: stop
section_title: ${stop.parentStop ? stop.parentStop.name : stop.name}
title: ${stop.name}
stop_id: ${file}
audio_file: ${stop.file}.mp3
---\n\n`
    var content = frontMatter + transcriptWithSpeakers[stop.id || file]
    fs.writeFileSync(`${tourName}/${file}.md`, content)
  })
})

// write an index file
fs.writeFileSync(`${tourName}/index.md`, `---
title: ${tour.title}
mp3_location: ${tour.mp3_location}
paid: ${tour.paid}
---${tour.content}`)