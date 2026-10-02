require 'json'
require 'nokogiri'
require 'uri'
require 'digest'

site = File.expand_path('../_site', __dir__)
manifest = JSON.parse(File.read(File.expand_path('../docs/migration-manifest.json', __dir__)))
errors = []
html_files = Dir.glob("#{site}/**/*").select { |f| File.file?(f) && (f.end_with?('.html') || File.extname(f).empty?) }
documents = html_files.to_h { |f| [f, Nokogiri::HTML(File.read(f))] }
home = documents.fetch("#{site}/index.html")
plain = ->(text) { text.gsub(/\s+/, ' ').strip }
errors << 'Expected five recent homepage news items' unless home.css('.news tr').size == 5
errors << 'Missing News section' unless home.at_css('#news')
errors << 'Expected three selected papers' unless home.css('.publications li').size == 3
errors << 'Expected three homepage projects' unless home.css('.projects .project-item').size == 3
manifest['projects'].each do |project|
  errors << "Missing project: #{project['title']}" unless plain.call(home.text).include?(project['title'])
  errors << "Missing project description: #{project['title']}" unless plain.call(home.text).include?(project['description'])
end
manifest['resources'].each do |item|
  [item['old'], item['new']].uniq.each do |path|
    file = "#{site}/#{path}"
    errors << "Resource changed or missing: #{path}" unless File.file?(file) && Digest::SHA256.file(file).hexdigest == item['sha256']
  end
end
resolve = lambda do |path|
  base = "#{site}#{URI::DEFAULT_PARSER.unescape(path)}"
  [base, "#{base}/index.html", "#{base}.html"].find { |f| File.file?(f) }
end
manifest['publications'].each do |item|
  errors << "Missing legacy publication: #{item['permalink']}" unless resolve.call(item['permalink'])
end
%w[/publications/ /projects/ /cv/ /cv-json/ /resume /resume-json /about/ /about.html /portfolio/ /sitemap/ /sitemap.xml /404.html].each do |path|
  errors << "Missing page or redirect: #{path}" unless resolve.call(path)
end
publications = documents.fetch("#{site}/publications/index.html")
expected_keys = %w[zhao2026autoregressive zhao2026impact xie2026diffusion zhang2026failure jin2026generative zhang2026phasefield]
selected_keys = home.css('.selected-publications .row > div[id]').map { |entry| entry['id'] }
errors << 'Selected papers are missing or out of order' unless selected_keys == expected_keys.first(3)
errors << 'Public bibliography is incomplete or out of order' unless publications.css('.publication-text-entry').map { |entry| entry['id'] } == expected_keys
errors << 'Publications must have no thumbnails' unless publications.css('article img, article picture').empty?
errors << 'Each public paper must highlight Dazhi Zhao' unless publications.css('.publication-authors strong').size == 6
errors << 'Missing equal contribution note' unless home.at_css('#zhao2026impact').text.include?('† Equal contribution.')
%w[Keke Rui MIAS].each { |name| errors << "Missing Tongji relationship: #{name}" unless home.text.include?(name) }
errors << 'Missing final-year status' unless plain.call(home.text).include?('final year of my B.Eng. in Engineering Mechanics')
errors << 'Missing completed internship dates' unless plain.call(home.text).include?('From January to September 2026, I was a Research Intern')
errors << 'Outdated academic status' if home.text.match?(/third.year|currently visiting|Visiting Student/i)
news = documents.fetch("#{site}/news/index.html")
errors << 'Expected nine News entries' unless news.css('.news tr').size == 9
errors << 'News missing from sitemap' unless File.read("#{site}/sitemap.xml").include?('/news/')
manifest['news'].each do |item|
  errors << "Missing original News date #{item['date']}" unless resolve.call("/news/#{item['date']}/")
end
# Scan every production artifact, including JSON, JavaScript, XML and bibliography files.
# This runs with the ignored local preview source still present on the developer machine.
private_patterns = [/Differentiable Phase.Field Simulation/i, /Shuheng.{0,20}Liao/i, /Liao.{0,20}Shuheng/i, /local multiscale statistics/i, /local_preview/]
Dir.glob("#{site}/**/*").select { |f| File.file?(f) }.each do |file|
  contents = File.binread(file).force_encoding('UTF-8').scrub
  errors << "Private preview leaked into #{file.delete_prefix(site)}" if private_patterns.any? { |pattern| contents.match?(pattern) }
  errors << "Private bibliography copied into production: #{file}" if file.include?('local-preview')
end
documents.each do |file, doc|
  relative = file.delete_prefix(site)
  next if doc.at_css('meta[http-equiv="refresh"]')
  errors << "Demo content in #{relative}" if doc.text.match?(/Albert Einstein|GitHub University|Paper Title Number|Blog Post number|Your Name|You\. R\. Name|example_pdf/i)
  doc.css('a[href], img[src], script[src], link[href]').each do |node|
    link = node['href'] || node['src']
    next if link.nil? || link.empty? || link.start_with?('mailto:', 'tel:', 'data:', 'javascript:')
    begin
      url = URI.join("https://dazhizhao.github.io#{relative}", link)
      next unless url.host == 'dazhizhao.github.io'
      target = resolve.call(url.path)
      errors << "Broken internal URL: #{relative} -> #{link}" unless target
      if target && url.fragment && !url.fragment.empty? && documents[target]
        has_anchor = documents[target].css('[id], a[name]').any? { |n| [n['id'], n['name']].include?(URI::DEFAULT_PARSER.unescape(url.fragment)) }
        errors << "Missing anchor: #{relative} -> #{link}" unless has_anchor
      end
    rescue URI::InvalidURIError
      errors << "Invalid URL: #{relative} -> #{link}"
    end
  end
end
abort errors.uniq.join("\n") unless errors.empty?
puts "PASS: #{documents.size} HTML pages; academic content, public/private separation, resource hashes, internal URLs, and old routes."
