# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.
require 'settings.rb'
require 'git.rb'
require 'json'
require 'ruby_utility.rb'
require 'rails_utility.rb'

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  # protect_from_forgery # See ActionController::RequestForgeryProtection for details

  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password
  before_filter :before_action
  
  def before_action
      @SETTINGS = $SETTINGS
      
      @user = User.new
  end
  
  def oauth_redirect_uri
      "http://#{$SETTINGS[:host]}:#{$SETTINGS[:port]}/oauth/rt"
  end
  # url to get authorized code
  def oauth_url_authorize
      return "#{$SETTINGS[:oauth_server_url_authorize]}?response_type=code&client_id=#{$SETTINGS[:oauth_client_id]}&scope=ALL&redirect_uri=#{oauth_redirect_uri}"    
  end
  # url to get access token
  def oauth_url_token(code)
      return "#{$SETTINGS[:oauth_server_url_token]}?code=#{code}&grant_type=authorization_code&client_id=#{$SETTINGS[:oauth_client_id]}&client_secret=#{$SETTINGS[:oauth_client_secret]}&redirect_uri=#{oauth_redirect_uri}"    
  end 
  def start_oauth_flow
      redirect_to(oauth_url_authorize)  
  end
  
  def oauth_enabled?
      $SETTINGS[:oauth_server_url_authorize] && $SETTINGS[:oauth_server_url_token] &&
      $SETTINGS[:oauth_client_secret] && $SETTINGS[:oauth_client_id]
  end
  # return false if no session
  def check_session
      return true if !oauth_enabled?
          
      p "check_session"
      if cookies[:atoken]
          session[:atoken] = cookies[:atoken]
      elsif session && session[:atoken]== nil
          start_oauth_flow
          return false
      end
      return true
  end
  # check from ajax
  # 
  def check_session_a
      p "check_session"
      p "session[:atoken] #{session[:atoken]}"
      if !session || session[:atoken]== nil
          error("no session", {:oauth_url=>oauth_url_authorize})
          p "start oauth"
          return false
      end
        p "session:#{session}"
      success()
      return true
  end  
  
  #=== for ajax return ===#
  def error(msg, data=nil)
       ret = {
          "error"=>msg
      }
      ret = ret.merge(data) if data
      render :text=>ret.to_json
      # render :text=>"{\"error\":\"#{msg}\"}"
  end
  def success(msg="OK", data=nil)
      ret = {
          "OK"=>msg
      }
      ret = ret.merge(data) if data
      render :text=>ret.to_json
      
  end
  #=== END OF for ajax return ===#
  
  def repo_url(repo)
      # "#{@user.name}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"
      if $SETTINGS[:git_protocol] == "https"
          return "https://#{$SETTINGS[:git_server]}#{$SETTINGS[:repo_root]}/#{repo}"
      else
          return "#{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"
      end
  end
  
  def workspace_path
      "#{$SETTINGS[:workspace_root]}/#{@user.name}"
  end
  
  def repo_ws_path(repo)
      "#{$SETTINGS[:workspace_root]}/#{@user.name}/#{repo}"
  end
end
