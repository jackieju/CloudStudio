require 'rubygems'
require 'settings.rb'
# require 'git'

class RepoController < ApplicationController
    
    def createapp
        appid=params[:appid]
        name=params[:name]
        desc=params[:desc]
        
        begin
        p "appid=>#{appid}"
        App.new({
            :appid=>appid,
            :name=>name,
            :desc=>desc,
            :uid=>@user.id
        }).save!
        rescue Exception=>e
            error("create app failed #{e.inspect}")
            return
        end
        
        _create_repo(appid)
        
        success()
        
    end
    
    # create repo for one app
    def create_repo
        repo = params[:repo]
        
        if !repo || repo == ""
            error("invalid repository name")
            return
        end
        p "cd #{$SETTINGS[:repo_root]}\n
               git init --bare #{repo}.git
               chown -R git:git #{repo}.git"
               
        r = system "cd #{$SETTINGS[:repo_root]}\n
               git init --bare #{repo}.git
               chown -R git:git #{repo}.git"
        
        p "system call return #{r}"
        
        success('OK', {:ret=>r})
    end
    

    
    # prepare work space for one for one user
    def prep_app()
        repo = params[:repo]
        init(repo+".git")
        success('OK')
    end
    
    # clone repo for user
    def init(repo)       
        # = Git.clone("#{@user.name}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}",
        # repo, :path => './tmp/checkout')
         # g = Git.clone("#{@user.name}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}", repo)
        # g.config('user.name', @user.name)
        # g.config('user.email', @user.email)
        
        Git.clone(repo, @user.name)
                
    end
    
    def _create_repo(repo)
        p "cd #{$SETTINGS[:repo_root]}\n
                git init --bare #{repo}.git"
                
        r = system "cd #{$SETTINGS[:repo_root]}\n
                git init --bare #{repo}.git"

        p "system call return #{r}"
         
    end
    
    
end
