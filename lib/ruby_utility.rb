require 'net/https'
require 'net/http'

def hash_to_querystring(hash)
  if hash == nil or hash.empty?
    return ""
  end
  puts "==.>1"
  qs = hash.keys.inject('') {|query_string, key|
    v = hash[key]
    v = "" if v==nil
    query_string += '&' unless key == hash.keys.first
    query_string += "#{URI.encode(key.to_s)}=#{URI.encode(v)}"
    # p "inject1:"+query_string
    # query_string1
  }
  puts "inject2:#{qs}"
  
  return qs
end

def http_get(url, p, https=false, port=nil)
  uri = URI.parse(url)
  if port != nil
      _port = port
  elsif https == true
      _port = 443
  else
      _port = uri.port
  end
  http = Net::HTTP.new(uri.host, _port)
  http.use_ssl = true if https
  
  http.get(uri.path+"?"+hash_to_querystring(p), nil)
end 

 def qs_to_hash(query)
     keyvals = query.split('&').inject({}) do |result, q|
     k,v = q.split('=')
     if !v.nil?
     result.merge({k => v})
     elsif !result.key?(k)
     result.merge({k => true})
     else
     result
     end
     end
     keyvals
 end

# def http_post(url, p)
#       p "==>url=#{url}"
# 
#     uri = URI.parse(url)
#     p "==>uri=#{uri.inspect}"
# 
#     data = Net::HTTP.post_form(uri, qs_to_hash(uri.query))
#     p "==>data:#{data.inspect}"
#     return data
# end
def https_post(url,p)
    http_post(url, p)
end
# url:
# p: hash of parameters
def http_post(url, hash=nil, _port=nil)
 
    p "==>url=#{url}"
    
  uri = URI.parse(url)
  p "==>uri=#{uri.inspect}"
  bHttps = false
  bHttps = true if uri.scheme == "https"
  if _port
      port = _port
  else
      port = uri.port
      if !uri.port || uri.port == ""
          if bHttps
              port = 443 
          else
              port = 80 
          end
      end
  end
# make sure your port is correct

#way 1
=begin
  req = Net::HTTP::Post.new(uri.path)
  req.set_form_data(qs_to_hash(uri.query))
  p "==>#{qs_to_hash(uri.query).inspect}"
  p "===>host #{uri.host}, port #{_port}"
  https = Net::HTTP.new(uri.host, _port)
  https.use_ssl = true 
  res = https.start {|http| http.request(req) }
  puts "===>http code #{res.code}"
=end	   
#end way 1

#way 2
  p "-->port:#{port}, host:#{uri.host}, #{uri.query}, #{uri.path}"
     # p "->#{uri.path}?#{uri.query}"
     http = Net::HTTP.new(uri.host, port)
     if bHttps
         http.use_ssl = true
     end
     p '====>1'
     params = uri.query
     params = "" if !params
     p '====>2'
     
     p "hash=#{hash}"
     if hash
           p "====>#{params.inspect}"
         params += "&"+hash_to_querystring(hash)
         p '====>31'
     end
          
     p "params #{params}"
     resp, data = http.post(uri.path, params)
# end way 2

	 return data
end
=begin pastable code
begin
    raise Exception.new
rescue Exception=>e
    stack = 100
    if e.backtrace.size >=2 
        stack  += 1
        stack = e.backtrace.size-1 if stack >= e.backtrace.size
        p e.backtrace[1..stack].join("\n") 
    end
end
=end
def show_stack(stack = nil)
	stack = 99999 if stack == nil || stack <= 0
	begin
	    raise Exception.new
	rescue Exception=>e
	    if e.backtrace.size >=2 
	        stack  += 1
	        stack = e.backtrace.size-1 if stack >= e.backtrace.size
	        return e.backtrace[1..stack].join("\n") 
	    end
	end
	return ""
end