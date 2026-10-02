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
manifest['news'].each do |item|
  expected = plain.call(Nokogiri::HTML.fragment(item['text']).text)
  errors << "Missing news: #{expected}" unless plain.call(home.text).include?(expected)
end
errors << 'Expected six homepage news rows' unless home.css('.news tbody tr, .news table > tr').size == 6
errors << 'Expected three selected papers' unless home.css('.publications li').size == 3
errors << 'Expected two homepage projects' unless home.css('.projects .project-item').size == 2
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
%w[/publications/ /projects/ /news/ /cv/ /cv-json/ /resume /resume-json /about/ /about.html /portfolio/ /sitemap/ /sitemap.xml /404.html].each do |path|
  errors << "Missing page or redirect: #{path}" unless resolve.call(path)
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
puts "PASS: #{documents.size} HTML pages; migrated content, resource hashes, internal URLs, and old routes."
