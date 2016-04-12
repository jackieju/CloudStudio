require "settings.rb"
$git_user = "git"

class GitExp < Exception
    attr_accessor :git_msg, :exitstatus, :command
    def initialize(em, m, e, c)
        super(em)
        @git_msg = m
        @exitstatus = e
        @command = c
    end
end

class Git2

    def self.clone( repo, username)
        p "===>#{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"  
        
          command = "mkdir -p #{$SETTINGS[:workspace_root]}/#{username}\n
                    cd #{$SETTINGS[:workspace_root]}/#{username}\n 
                    git clone #{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"
            p "command=>#{command}"
            r = `#{command}`
            # success('OK', {:ret=>r})
            p "==>r=#{r}"
            if $?.exitstatus != 0
                raise Exception.new("git command=>#{command}\n return:\n#{r}")
            end
            return true
    end
    
    def self.pull(repo, username)
        p "===>#{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"  
        
              command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                        git pull"
                p "command=>#{command}"
                # r = `#{command}`
                #          # success('OK', {:ret=>r})
                #          p "==>r=#{r}"
                #          if $?.exitstatus != 0
                #              raise Exception.new("git command=>#{command}\n return:\n#{r}")
                #          end
            return do_cmd(command)
    end
    def self.push(repo, username)
        p "===>#{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"  
        
              command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                        git push origin master"
                p "command=>#{command}"
                # r = `#{command}`
                #   # success('OK', {:ret=>r})
                #   p "==>r=#{r}"
                #   if $?.exitstatus != 0
                #       raise Exception.new("git command=>#{command}\n return:\n#{r}")
                #   end
                #   
                return do_cmd(command)
      
    end  
     
    def self.add_and_commit(repo, username, filepath, msg="c")
         p "===>#{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"  

         command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                git add \"#{filepath}\" 
                git commit \"#{filepath}\" -m \"#{msg}\""
                
        p "command=>#{command}"
        # r = `#{command}`
        # # success('OK', {:ret=>r})
        # p "==>r=#{r}"
        # if $?.exitstatus != 0
        #     raise Exception.new("git command=>#{command}\n return:\n#{r}")
        # end
        # self.commit(repo, username, filepath, msg)
        
        return do_cmd(command)
    end
    def self.commit(repo, username, filepath, msg="c")
        p "===>#{$git_user}@#{$SETTINGS[:git_server]}:#{$SETTINGS[:repo_root]}/#{repo}"  
        
              command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                        git commit \"#{filepath}\" -m \"#{msg}\""
                p "command=>#{command}"
                    # r = `#{command}`
                    #     # success('OK', {:ret=>r})
                    #     p "==>r=#{r}"
                    #     if $?.exitstatus != 0
                    #         raise Exception.new("git command=>#{command}\n return:\n#{r}")
                    #     end
                    
                    return do_cmd(command)
        
    end
    def self.do_cmd(command)
        a = ""
        command = "#{command} 2>&1"
        r = `#{command}`
        # return stdout, #? is process object
        p "==>r=#{r}" 
        
        if $?.exitstatus != 0
            raise GitExp.new("git command=>#{command}\n , exit status #{$?.exitstatus }, >>>return:\n#{r}", r, $?.exitstatus, command)
        end
        return r
    end
    def self.status(repo, username, filepath="", args="")
        if filepath == "" || filepath == nil
            command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                    git status #{args} "
        else
            command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                    git status #{args} \"#{filepath}\" "
        end
        p "command=>#{command}"
        return do_cmd(command)
    end   
    def self.diff(repo, username, filepath="", args="")
        if filepath == "" || filepath == nil
            command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                    git diff #{args} "
        else
            command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                    git diff #{args} \"#{filepath}\" "
        end
        p "command=>#{command}"
        return do_cmd(command)
    end
    def self.log(repo, username, filepath="", args="")
        if filepath == "" || filepath == nil
            command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                    git log #{args} "
        else
            command = "cd #{$SETTINGS[:workspace_root]}/#{username}/#{repo}\n 
                    git log #{args} \"#{filepath}\" "
        end
        p "command=>#{command}"
        return do_cmd(command)
    end
end
