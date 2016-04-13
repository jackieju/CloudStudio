class DeController < ApplicationController
    def o
        @data = open_file(params[:appid], params[:fname], 'json')
        if @data[:dtype] == nil
            @data[:dtype]  = {}
        end
        @data.normalize
        

        p "data=>#{@data.class}=>#{@data.inspect}"
        p "data.name=#{@data[:name]}"
    end
end
