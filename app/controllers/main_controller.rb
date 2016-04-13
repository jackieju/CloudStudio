class MainController < ApplicationController
    def index
        @git_enabled = true
        @git_enabled = false if !$SETTINGS[:git_server] or $SETTINGS[:git_server] == ""
            
        @oauth_enabled = oauth_enabled?
        p "===>@oauth_enabled=#{@oauth_enabled}"
        if @oauth_enabled
            @oauth_redirect_uri  = $SETTINGS[:oauth_redirect_uri]
            @oauth_server_url_authorize =$SETTINGS[:oauth_server_url_authorize]
            @oauth_client_id = $SETTINGS[:oauth_client_id]
        end
        
        @logwatch_enabled = false
        @logwatch_enabled = true if $SETTINGS[:console_log]
    
    end
end
