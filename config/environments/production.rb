# Settings specified here will take precedence over those in config/environment.rb

# The production environment is meant for finished, "live" apps.
# Code is not reloaded between requests
config.cache_classes = true

# Full error reports are disabled and caching is turned on
config.action_controller.consider_all_requests_local = false
config.action_controller.perform_caching             = true
config.action_view.cache_template_loading            = true

# See everything in the log (default is :info)
# config.log_level = :debug

# Use a different logger for distributed setups
# config.logger = SyslogLogger.new

# Use a different cache store in production
# config.cache_store = :mem_cache_store

# Enable serving of images, stylesheets, and javascripts from an asset server
# config.action_controller.asset_host = "http://assets.example.com"

# Disable delivery errors, bad email addresses will be ignored
# config.action_mailer.raise_delivery_errors = false

# Enable threaded mode
# config.threadsafe!
config.logger = Logger.new("#{Rails.root}/log/#{Rails.env}.log", 50, 51200000*2)

config.logger.level = Logger::DEBUG


$SETTINGS=
     {
        :git_server=>"localhost",
        :repo_root=>"/var/mygithub",
        :workspace_root=>"./tmp/workspaces",
        # :appstore_query_app_url=>"http://127.0.0.1:3001/app/query_app",
        :appstore_query_app_url=>"http://appstore.anywhere.cn/app/query_app",
        :console_log=>"/home/jackie/jetty-distribution-9.1.4.v20140401/logs/%04d_%02d_%02d.stderrout.log",
        :submit_url=>"http://10.58.113.181:3001/app/presubmit",
        # ui full path:
        # /opt/share/sfaattachment/T1/rtspace/com.cid.oms/src/resources/UI-INF
        #/opt/share/sfaattachment is configed in sld
        # T1 is tenant id (not tenant name)
        # com.cid.oms is app bundle id (appid)
        # content under src is ui content
        :ui_root_dir=>"/opt/share/sfaattachment/T%s/rtspace",
        :oauth_server_url_authorize=>"https://10.58.118.63:8444/sld/oauth2/authorize",
        :oauth_server_url_token=>"https://10.58.118.63:8444/sld/oauth2/token",
        :oauth_client_secret=>"vkNfMXd0zN-zQ3-l3vFnokRBoqqF",
        :oauth_client_id=>"4874805429075418-yFNLByquAI63nUMkOxdZUoehmI0c85Um",
        :host=>"webide",
        :port=>"3000"
    }