require 'json'
require 'uglifier'


manifest = JSON.parse(File.read '_build.json')
fname = manifest['file']
raise 'No file specified.' if !fname
finclude = manifest['include'] || []
dest_name = manifest['output-name'] || 'app.js'
dest_dir = manifest['output-dir'] || 'dest'

# Extract script locations from HTML file
scriptsRegex = /<!\-\-\s*begin-scripts\s*-->(.*)<!\-\-\s*end-scripts\s*-->/mi
scriptSrcRegex = /<script\s*src="([^"]*)"\s*>/mi
file = File.read fname
scripts = file.scan(scriptsRegex)[0][0]
scripts = scripts.scan(scriptSrcRegex).map {|s| s[0]}

compiled = ''
len_orig = 0

# Compile JS file
scripts.each do |src|
  raise "File '#{src}' not found! Stopping." unless File.file? src
  code = File.read src
  len_orig += code.length
  compiled << Uglifier.compile(code) << "\n"
end

# Ensure dir exists
Dir.mkdir dest_dir if !Dir.exists? dest_dir
# Write HTML file with new <script> tag
File.open("#{dest_dir}/#{fname}", 'w') do |f|
  f.write(file.sub(scriptsRegex, "<script src=\"#{dest_name}\"></script>"))
end
# Write compiled JS file
File.open("#{dest_dir}/#{dest_name}", 'w') {|f| f.write compiled }
# Copy included files
finclude.each do |f|
  IO.copy_stream(f, "#{dest_dir}/#{f}")
end

# Show percent reduction
puts "Compression: %.1f%\nDone." %
  [100.0 * (len_orig - compiled.length) / len_orig]
