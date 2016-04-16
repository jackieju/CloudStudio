class DeController < ApplicationController
    def o
        @data = open_file(params[:appid], params[:fname], 'json')
        if @data["dtype"] == nil
            @data["dtype"]  = {}
        end
        if params[:rtype] == 'json'
            render :text=>@data.to_json
            return
        end
        
        @data.normalize
        

        p "data=>#{@data.class}=>#{@data.inspect}"
        p "data.name=#{@data[:name]}"
    end
end
