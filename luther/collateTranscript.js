var fs = require('fs')
var path = require('path')
var R = require('ramda')
var m2j = require('markdown-to-json-with-content')
var remark = require('remark')
var YAML = require('yamljs')
var {execSync} = require('child_process')

var rawMarkdown = execSync(
  'textutil -convert html transcript.doc -stdout | pandoc -r html -w markdown_github', 'utf-8',
  {encoding: 'utf-8'}
).toString('utf-8')

var processedMd = rawMarkdown
  .replace(/^(\d+)([A-C]?)/gm, '**$1$2**') // bold stop headings
  .replace(/<span class="Apple-converted-space">..?<\/span>/g, ' ') // remove junk from `textutil` doc conversion

var transcript = remark().process(processedMd).contents

// console.info(transcript)
// return

// Break the transcript up by stop number, accenting the person speaking with `##`
//     ('Patrick Noon:' -> '## Patrick Noon\n\n')
var transcriptWithSpeakers = R.splitEvery(2, transcript.split('**').splice(1))

// console.info(JSON.stringify(transcriptWithSpeakers, null, 2))
// return

var matchName = /^(([\w\s\-.]+){2,5}):(.*)$/gm
var matchName = /^(([\w\s\-\.]+){2,6}):(.+)$/gm
transcriptWithSpeakers = transcriptWithSpeakers.reduce(function(dict, [stop, transcript]) {
  // remove title (the first line after the stop number)
  // from the transcript text
  var [title, ...transcript] = transcript.trim().split('\n')
  transcript = transcript.join('\n\n')

  console.info(stop)
  if(["22"].indexOf(stop) < 0) return dict

  console.info(JSON.stringify(transcript))
  // transform speaker from "name:" to "## name\n\n"
  // why is this so slow? like it takes 45 minutes to regex
  // oh regex
  var speakerHeadings = transcript.replace(matchName, function(match, person, _, words, offset, string) {
    return `## ${person.trim()}\n\n${words.trim()}\n\n`
  })
  dict[stop] = speakerHeadings

  // save to file
  var file = stop.replace(/^0([0-9])([ABC])$/, '$1$2') + '.md'
  console.info(file)
  fs.appendFileSync(file, '\n\n'+speakerHeadings)

  return dict
}, {})

// console.info(transcriptWithSpeakers)
