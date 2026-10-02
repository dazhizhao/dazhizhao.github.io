# frozen_string_literal: true

require 'digest'
require 'json'

# al_folio_core 1.0.15 hashes theme Sass but misses this site's _sass overrides.
# Keep its theme version and include the local inputs used by main.scss.
module HomepageCssCacheBust
  def bust_css_cache(file_name)
    site = @context.registers[:site]
    digest = Digest::SHA256.new
    digest.update(super)
    digest.update([site.config['max_width'], site.config['sass']].to_json)
    files = Dir[File.join(site.source, '_sass', '**', '*.{scss,sass}')]
    files += Dir[File.join(site.source, 'assets', 'css', '*.{scss,sass}')]
    files.sort.each do |file|
      digest.update(file.delete_prefix("#{site.source}/")).update("\0")
      digest.update(File.binread(file)).update("\0")
    end
    "#{file_name}?v=#{digest.hexdigest}"
  end
end

Jekyll::CacheBust.prepend(HomepageCssCacheBust)
