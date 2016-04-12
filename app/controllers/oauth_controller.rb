class OauthController < ApplicationController
    def rt #receive authorized token
        p "receive token #{params[:code]}"
        authroized_code = params[:code]
        
        # request access token
        data = https_post(oauth_url_token(authroized_code), nil)      
        ret = JSON.parse(data)
        p "access token #{ret}"
        session[:atoken] = ret['access_token']
        session[:rtoken] = ret['refresh_token']
        
        redirect_to "/index.html?appid=#{session[:appid]}"
        # render :text=>"ok"
    end
    
    # check
    def c
        session[:appid] = params[:appid]
        check_session_a
    end
end
