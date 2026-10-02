require 'tmpdir'
require 'fileutils'
require 'jekyll'
require 'jekyll-cache-bust'
require 'al_folio_core'
require_relative '../_plugins/css_cache_bust'

Dir.mktmpdir('homepage-css-cache') do |source|
  FileUtils.mkdir_p(["#{source}/_sass", "#{source}/assets/css"])
  partial = "#{source}/_sass/_site.scss"
  entry = "#{source}/assets/css/main.scss"
  File.write(partial, '.about-intro { display: grid; }')
  File.write(entry, '@use "site";')
  site = Struct.new(:source, :config).new(source, { 'max_width' => '930px', 'sass' => { 'style' => 'compressed' } })
  render = -> { Liquid::Template.parse("{{ '/assets/css/main.css' | bust_css_cache }}").render!({}, registers: { site: site }) }
  baseline = render.call
  abort 'Identical stylesheet inputs must keep the same URL' unless render.call == baseline
  [
    -> { File.write(partial, '.about-intro { display: grid; column-gap: 60px; }') },
    -> { File.write(entry, '@use "site"; body { color: black; }') },
    -> { site.config['max_width'] = '1000px' }
  ].each do |change|
    before = render.call
    change.call
    abort 'Stylesheet URL must change when a CSS input changes' if render.call == before
  end
end

puts 'PASS: CSS URLs are stable and change with local Sass, entrypoint, and layout settings.'
