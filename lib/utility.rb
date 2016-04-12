$context = nil
def m(s)
    if $context
        if $context[:msg]
            $context[:msg] += s
        else
            $context[:msg] = s
        end
    end
end

def li(s)
    "<div>#{s}</div>"
end

def workspace_path(username)
    "#{$SETTINGS[:workspace_root]}/#{username}"
end

def repo_ws_path(repo, username)
    "#{$SETTINGS[:workspace_root]}/#{username}/#{repo}"
end