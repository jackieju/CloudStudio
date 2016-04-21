class SearchController < ApplicationController
    def openfile(fname, return_type=nil)
        p "read file #{fname}"
        data = ""
        begin
            if FileTest::exists?(fname) 
                    open(fname, "r+") {|f|
                           data = f.read

                       p "===>data(#{fname}):#{data}"
                            data = "" if data == nil

                       }


            end
        rescue Exception=>e
             p e.inspect
             p e.backtrace[1..e.backtrace.size-1].join("\n\r")

        end

         if return_type == 'json'
                p "data:#{data}"
                if data.strip == ""
                    data = {}
                else
                    data = JSON.parse(data)
                end
            end
       return data 
    end
    
    def index
        ret = {}
        
        @keys = k = params[:k]
        @appid = appid = params[:appid]
        rtype = params[:rtype]
        @result = {}
        
        if @appid.end_with?(".git")
            @appid = @appid[0..@appid.size-5]
        end
        
        p "k:#{k}"
        if !k || k == "" || !appid || appid== ""
            if rtype == "json"
                success("OK", ret)
                return
            end
            return
        end
        
        ks = k.split(" ")
        # grep arguments
        sw = ks.join("|")
        
        type = params[:type]
        if !type
            stype = "*"
        elsif type == "Data Element"
            stype = "*.de"
        elsif type == "Data Group"
            stype = "*.degrp" 
        end
        
        approotdir = repo_ws_path(appid)+"/app"
        cmd = "find #{approotdir} -name \"#{stype}\" |xargs grep -H \"#{k}\""
        p "cmd:#{cmd}"
        res =`#{cmd}`
        p res
        res.each_line{|line|
            i = line.index(":")
            i2 = line.index(approotdir)
            if (i && i2 && i >= 0 && i2 >=0 && i2 < i)
                s = line[i2+approotdir.size..i-1]
                p "file:#{s}"
                h = {:file=>s}
                data = openfile("#{approotdir}#{s}", 'json')
                h[:data]=data
                p h.inspect
                @result[s]=h
                
            end
        }
        
    end
end
