# Settings specified here will take precedence over those in config/environment.rb

# In the development environment your application's code is reloaded on
# every request.  This slows down response time but is perfect for development
# since you don't have to restart the webserver when you make code changes.
config.cache_classes = false

# Log error messages when you accidentally call methods on nil.
config.whiny_nils = true

# Show full error reports and disable caching
config.action_controller.consider_all_requests_local = true
config.action_view.debug_rjs                         = true
config.action_controller.perform_caching             = false

# Don't care if the mailer can't send
config.action_mailer.raise_delivery_errors = false



$SETTINGS=
     {
        # git integration
        :git_protocol=>"https",
        #:git_server=>"10.58.9.209",
        :git_server=>"github.wdf.sap.corp",
        :repo_root=>"/I027910",
        :workspace_root=>"./tmp/workspaces",
        
        # server log watcher
        # :console_log=>"/home/jackie/jetty-distribution-9.1.4.v20140401/logs/%04d_%02d_%02d.stderrout.log"
        # :console_log=>"/Users/i027910/Desktop/SAP/src/oce/log/development.log",
        
        
        # commit to app store
        #:appstore_query_app_url=>"http://appstore.anywhere.cn/app/query_app",
        #:submit_url=>"http://127.0.0.1:3001/app/presubmit",
         
        #:ui_root_dir=>"/opt/share/sfaattachment/T%s/rtspace",
        
        # oauth settings
        #:oauth_server_url_authorize=>"https://10.58.118.63:8444/sld/oauth2/authorize",
        #:oauth_server_url_token=>"https://10.58.118.63:8444/sld/oauth2/token",
        #:oauth_client_secret=>"vkNfMXd0zN-zQ3-l3vFnokRBoqqF",        
        #:oauth_client_id=>"client1.id",
        #:oauth_redirect_uri="http://d.anywhere.cn/index.html",
        
        :host=>"webide",
        :port=>"3000"        
    }

