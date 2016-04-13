# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.
require 'settings.rb'
require 'git.rb'
require 'json'
require 'ruby_utility.rb'
require 'rails_utility.rb'
require 'hash.rb'

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
      return true if $SETTINGS[:oauth_server_url_authorize] && $SETTINGS[:oauth_server_url_token] &&
      $SETTINGS[:oauth_client_secret] && $SETTINGS[:oauth_client_id]
    return false
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
  
    
    # /project/extension/untitle1.rb => {
    # :path=>"/project/extension/Untitled1.rb",
    # :cat2=>"Untitled1.rb", 
    # :project=>"project",
    # :cat1=>"extension", 
    # :relative_dir=>"extension", 
    # :relative_path=>"extension/Untitled1.rb", 
    # :fname=>"Untitled1.rb"
    # }
    # save file to ./tmp/workspaces/i027910/rrr/app/extension/Untitled1.rb
    def fileInfoFromPath(path)
        p "===>path #{path}"
        b = path.split('/')
        fname = b[b.size-1]
        if path.start_with?("/")
            b = b[1..b.size-1]
        end
            prj = b[0]
         p "===>prj=#{prj} #{b.size}"
         cat = b[1]
         cat2 = nil
         if (b.size > 2)
             cat2 = b[2]
         end
        r =  {
             :path=>path,
             :project=>prj,
             :fname=>fname,
             :cat1=>cat,
             :cat2=>cat2,
             :relative_path=>b[1..b.size-1].join("/"),
             :relative_dir=>b[1..b.size-2].join("/")

         }
         p r
        return {
            :path=>path,
            :project=>prj,
            :fname=>fname,
            :cat1=>cat,
            :cat2=>cat2,
            :relative_path=>b[1..b.size-1].join("/"),
            :relative_dir=>b[1..b.size-2].join("/")
            
        }
    end
  def open_file(repo, path, return_type=nil)
      fi= fileInfoFromPath(path)
      fname = fi[:fname]
      
      # dir = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
      
      fname = "#{repo_ws_path(repo)}/app/#{fi[:relative_path]}"
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
end
