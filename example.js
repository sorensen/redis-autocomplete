#!/usr/bin/env node

/*!
 * Module dependencies
 */

var program = require('commander')
  , keypress = require('keypress')
  , redis = require('redis')
  , db = redis.createClient()
  , AutoComplete = require('../index')
  , auto
  , noop = function() {}
  , sep = ''
  , input = ''
  , ignore = ['up', 'left', 'down', 'right']

// Get configuration options
program
  .option('-n, --names', 'Load names')
  .option('-t, --ttl [ttl]', 'Time to live')
  .option('-m, --max [max]', 'Max length')
  .parse(process.argv)

// Create the autocomplete client
auto = new AutoComplete(db, {
  prefix: 'autocomplete:'
, ttl: program.ttl ? +program.ttl : 60 * 60
, maxLength: program.max ? +program.max : 100
})

// Build string seperator for visual
for (var i = 0; i < 76; i++) {
  sep = sep + '-'
}

// Index a search term
function index(msg) {
  auto.index(msg, noop)
}

// Get autocomplete results
function search(msg) {
  auto.search(msg, 20, function(err, resp) {
    process.stdout.write(resp.join('\n'))
  })
}

// Exit process and destroy dataset
function exit() {
  process.stdin.pause()
  auto.destroy(function() {
    process.exit(0)
  })
}

// Clear the terminal and print current input
function print() {
  process.stdout.write('\u001B[2J\u001B[0;0f')
  process.stdout.write(sep + '\n')
  process.stdout.write('> ' + input)
  process.stdout.write('\n' + sep + '\n')
}

print()
keypress(process.stdin)

auto.on('ready', function() {
  if (program.names) {
    auto.parseFile(__dirname + '/test/names.txt', noop)
  }
  process.stdin.on('keypress', function(ch, key) {
    if (key && key.ctrl && key.name === 'c') {
      return exit()
    } else if (!ch || ch === 'undefined' || !!~ignore.indexOf(key.name)) {
      return
    } else if (key.name === 'backspace') {
      input = input.substr(0, input.length - 1)
    } else if (key.name === 'enter') {
      index(input)
      input = ''
    } else {
      input += ch
    }
    print()
    search(input)
  })
})

process.stdin.setRawMode(true)
process.stdin.resume()
